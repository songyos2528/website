const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcryptjs = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer');
const { messagingApi } = require('@line/bot-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Email & LINE Configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || ''
  }
});

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
});

// Configure CORS origins based on environment
const corsOrigins = () => {
  if (NODE_ENV === 'production') {
    // Production: use configured domain from environment
    const frontendUrl = process.env.FRONTEND_PRODUCTION_URL || 'https://yourdomain.com';
    const frontendUrl2 = process.env.FRONTEND_URL || frontendUrl;
    return [frontendUrl, frontendUrl2];
  } else {
    // Development: allow localhost and network access
    return [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://192.168.1.41:5173',
      'http://192.168.1.41:5174'
    ];
  }
};

// Middleware
app.use(cors({
  origin: corsOrigins(),
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production', // Use HTTPS in production
    sameSite: 'lax'
  }
}));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '../app/public/uploads')));

// Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../app/public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Hardcoded data instead of database
const appData = {
  projects: [
    { id: 1, title: 'ตกแต่งห้องนอนสมัยใหม่', category: 'interior', description: 'ปรับปรุงห้องนอนให้ดูทันสมัย ด้วยวัสดุคุณภาพสูงและการออกแบบที่ลงตัว', img: 'https://images.unsplash.com/photo-1505693314967-38190d70baf0?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=80' },
    { id: 2, title: 'ต่อเติมห้องนั่งเล่น', category: 'interior', description: 'ต่อเติมพื้นที่ห้องนั่งเล่นเพิ่มขนาดให้กว้างขึ้น', img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=80' },
    { id: 3, title: 'รีโนเวทอพาร์ตเมนต์', category: 'renovation', description: 'รีโนเวทห้องพักทั้งห้อง เปลี่ยนพื้น ผนัง เพดาน และระบบไฟ', img: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=80' }
  ],
  calculatorTypes: [
    { id: 1, type_name: 'ต่อเติมห้อง', base_price: 50000 },
    { id: 2, type_name: 'รีโนเวทห้องน้ำ', base_price: 150000 },
    { id: 3, type_name: 'รีโนเวทครัว', base_price: 200000 },
    { id: 4, type_name: 'ทาสีบ้าน', base_price: 30000 }
  ],
  reviews: [
    { id: 1, name: 'นายสมชาย', role: 'เจ้าของบ้าน', text: 'งานดี คนตรงต่อเวลา ราคาสมควร', stars: 5, is_visible: 1 },
    { id: 2, name: 'นางสุนีย์', role: 'เจ้าของอพาร์ต', text: 'บริการดีเยี่ยม แนะนำได้', stars: 5, is_visible: 1 }
  ],
  businessInfo: { phone: '02-322-0000', email: 'info@company.com', address: 'Bangkok, Thailand' },
  services: [
    { id: 1, name: 'ต่อเติมบ้าน', description: 'ต่อเติมห้องและพื้นที่อื่น ๆ' },
    { id: 2, name: 'รีโนเวทบ้าน', description: 'ปรับปรุงบ้านเดิมให้ใหม่' },
    { id: 3, name: 'ออกแบบภายใน', description: 'ออกแบบและตกแต่งภายในบ้าน' }
  ],
  menus: [
    { name: 'แรกหน้า', link: '/' },
    { name: 'ผลงาน', link: '/projects' },
    { name: 'บริการ', link: '/services' },
    { name: 'ติดต่อ', link: '/contact' }
  ]
};


// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.admin) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};


// Helper: Format inquiry message
function formatMessage(contactData) {
  return `📬 ลูกค้าใหม่ขอใบเสนอราคา!\n\n👤 ชื่อ: ${contactData.name}\n📞 ติดต่อ: ${contactData.contact_info}\n📧 Email: ${contactData.email}\n\n💬 รายละเอียด:\n${contactData.message}`;
}

// Helper: Send email notification
async function sendEmailNotification(contactData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured, skipping');
    return { ok: false, error: 'Not configured' };
  }
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
    subject: `📬 ลูกค้าใหม่: ${contactData.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:24px;border-radius:8px">
        <h2 style="color:#c9a84c;margin-top:0">📬 ลูกค้าใหม่ขอใบเสนอราคา</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#555;width:120px">👤 ชื่อ</td><td style="padding:8px 0;font-weight:bold">${contactData.name}</td></tr>
          <tr><td style="padding:8px 0;color:#555">📞 ติดต่อ</td><td style="padding:8px 0">${contactData.contact_info}</td></tr>
          <tr><td style="padding:8px 0;color:#555">📧 Email</td><td style="padding:8px 0">${contactData.email}</td></tr>
        </table>
        <div style="background:#fff;padding:16px;border-radius:6px;margin-top:16px;border-left:4px solid #c9a84c">
          <p style="margin:0;color:#333;white-space:pre-wrap">${contactData.message}</p>
        </div>
        <p style="margin-top:20px;font-size:12px;color:#aaa">BSBuildTh Construction — Auto Notification</p>
      </div>
    `
  };
  try {
    await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email sent');
    return { ok: true };
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    return { ok: false, error: err.message };
  }
}

// Helper: Send LINE notification
async function sendLineNotification(contactData) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_ADMIN_USER_ID) {
    console.log('LINE not configured, skipping');
    return { ok: false, error: 'Not configured' };
  }
  try {
    await lineClient.pushMessage({
      to: process.env.LINE_ADMIN_USER_ID,
      messages: [{ type: 'text', text: formatMessage(contactData) }]
    });
    console.log('✅ LINE sent');
    return { ok: true };
  } catch (err) {
    console.error('❌ LINE failed:', err.message);
    return { ok: false, error: err.message };
  }
}

// Helper: Send Facebook notification (via Graph API → Page Inbox message to admin PSID)
async function sendFacebookNotification(contactData) {
  if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN || !process.env.FACEBOOK_ADMIN_PSID) {
    console.log('Facebook not configured, skipping');
    return { ok: false, error: 'Not configured' };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${process.env.FACEBOOK_PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: process.env.FACEBOOK_ADMIN_PSID },
          message: { text: formatMessage(contactData) }
        })
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    console.log('✅ Facebook sent');
    return { ok: true };
  } catch (err) {
    console.error('❌ Facebook failed:', err.message);
    return { ok: false, error: err.message };
  }
}

// --- ADMIN AUTHENTICATION ROUTES ---
// Hardcoded admin credentials (admin/admin123 - hash: bcryptjs)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = '$2a$10$pHPzHPZ6QzP5DfZ4QzP5eu'; // bcryptjs hash of 'admin123'

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  if (username === ADMIN_USERNAME && bcryptjs.compareSync(password, ADMIN_PASSWORD_HASH)) {
    req.session.admin = { id: 1, username: ADMIN_USERNAME };
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ success: true, message: 'Logged out' });
  });
});

app.get('/api/admin/check', (req, res) => {
  if (req.session && req.session.admin) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// --- PUBLIC ROUTES ---
app.get('/api/projects', (req, res) => {
  res.json(appData.projects);
});

app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const project = appData.projects.find(p => p.id === parseInt(id));
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ ...project, process_images: [] });
});

app.post('/api/contact', async (req, res) => {
  const { name, contactInfo, email, message } = req.body;

  if (!name || !contactInfo || !email || !message) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    // Send notifications only (no database save)
    const contactData = { name, contact_info: contactInfo, email, message };
    await Promise.allSettled([
      sendEmailNotification(contactData),
      sendLineNotification(contactData),
      sendFacebookNotification(contactData)
    ]);

    res.status(200).json({ success: true, message: 'ส่งคำขอเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROTECTED ADMIN ROUTES ---

app.post('/api/projects', requireAuth, upload.single('image'), (req, res) => {
  const { title, category, description } = req.body;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : '/project_1.png';

  if (!title) return res.status(400).json({ error: 'Title required' });

  // Stub: Database removed, returning success
  res.status(201).json({ success: true, id: appData.projects.length + 1, img: imgPath });
});

app.put('/api/projects/:id', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, category, description } = req.body;

  if (!title) return res.status(400).json({ error: 'Title required' });

  const project = appData.projects.find(p => p.id === parseInt(id));
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const imgPath = req.file ? `/uploads/${req.file.filename}` : project.img;
  // Stub: Database removed, returning success
  res.json({ success: true, img: imgPath });
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  // Stub: Database removed, returning success
  res.json({ success: true, changes: 1 });
});

// Project process images
app.post('/api/projects/:id/images', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { caption, sort_order } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const imgPath = `/uploads/${req.file.filename}`;
  // Stub: Database removed, returning success
  res.status(201).json({ success: true, id: 1, img_path: imgPath });
});

app.delete('/api/projects/:id/images/:imgId', requireAuth, (req, res) => {
  const { imgId } = req.params;
  // Stub: Database removed, returning success
  res.json({ success: true });
});

// --- CALCULATOR TYPES ROUTES ---
// Get all calculator types (PUBLIC - no auth required)
app.get('/api/calculator/types', (req, res) => {
  res.json(appData.calculatorTypes);
});

// Create new calculator type
app.post('/api/calculator/types', requireAuth, upload.single('image'), (req, res) => {
  const { type_name, base_price, sort_order } = req.body;
  const imagePath = req.file ? `/uploads/calculator/${req.file.filename}` : null;

  if (!type_name || !base_price) {
    return res.status(400).json({ error: 'Type name and base price required' });
  }

  // Stub: Database removed, returning success
  res.status(201).json({
    success: true,
    id: appData.calculatorTypes.length + 1,
    type_name,
    base_price: parseFloat(base_price),
    example_image_path: imagePath,
    sort_order: parseInt(sort_order) || 0
  });
});

// Update calculator type
app.put('/api/calculator/types/:id', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { type_name, base_price, sort_order } = req.body;

  if (!type_name || !base_price) {
    return res.status(400).json({ error: 'Type name and base price required' });
  }

  const calculator = appData.calculatorTypes.find(c => c.id === parseInt(id));
  const imagePath = req.file ? `/uploads/calculator/${req.file.filename}` : calculator?.example_image_path;

  // Stub: Database removed, returning success
  res.json({
    success: true,
    id,
    type_name,
    base_price: parseFloat(base_price),
    example_image_path: imagePath,
    sort_order: parseInt(sort_order) || 0
  });
});

// Delete calculator type
app.delete('/api/calculator/types/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  // Stub: Database removed, returning success
  res.json({ success: true, changes: 1 });
});

// --- REVIEWS ROUTES ---
// Get all visible reviews (PUBLIC)
app.get('/api/reviews', (req, res) => {
  const visibleReviews = appData.reviews.filter(r => r.is_visible === 1);
  res.json(visibleReviews);
});

// Get all reviews for admin (PROTECTED)
app.get('/api/reviews/all', requireAuth, (req, res) => {
  res.json(appData.reviews);
});

// Create new review (PROTECTED)
app.post('/api/reviews', requireAuth, (req, res) => {
  const { name, role, text, stars, is_visible } = req.body;

  if (!name || !role || !text) {
    return res.status(400).json({ error: 'Name, role, and text required' });
  }

  const starsNum = parseInt(stars) || 5;
  const isVisibleBool = is_visible !== false ? 1 : 0;
  const sortOrder = 0;

  // Stub: Database removed, returning success
  res.status(201).json({
    success: true,
    id: appData.reviews.length + 1,
    name,
    role,
    text,
    stars: starsNum,
    is_visible: isVisibleBool,
    sort_order: sortOrder
  });
});

// Update review (PROTECTED)
app.put('/api/reviews/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, role, text, stars, is_visible, sort_order } = req.body;

  if (!name || !role || !text) {
    return res.status(400).json({ error: 'Name, role, and text required' });
  }

  const starsNum = parseInt(stars) || 5;
  const isVisibleBool = is_visible !== false ? 1 : 0;
  const sortNum = parseInt(sort_order) || 0;

  // Stub: Database removed, returning success
  res.json({
    success: true,
    id,
    name,
    role,
    text,
    stars: starsNum,
    is_visible: isVisibleBool,
    sort_order: sortNum
  });
});

// Delete review (PROTECTED)
app.delete('/api/reviews/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  // Stub: Database removed, returning success
  res.json({ success: true, changes: 1 });
});

// --- BUSINESS INFO ROUTES ---
// Get business info (PUBLIC)
app.get('/api/business-info', (req, res) => {
  res.json(appData.businessInfo || {});
});

// Update business info (PROTECTED - admin only)
app.put('/api/business-info', requireAuth, (req, res) => {
  const { company_name, address, phone, email, line_id } = req.body;

  // Stub: Database removed, returning success
  res.json({
    success: true,
    company_name,
    address,
    phone,
    email,
    line_id
  });
});

// --- WEBSITE CONTENT MANAGEMENT ROUTES ---
// Get all content (PUBLIC)
app.get('/api/content', (req, res) => {
  res.json([]);
});

// Get specific content block (PUBLIC)
app.get('/api/content/:section_key', (req, res) => {
  res.json({});
});

// Create new content block (PROTECTED)
app.post('/api/content', requireAuth, (req, res) => {
  const { section_key, section_name, thai_content } = req.body;

  if (!section_key || !section_name || !thai_content) {
    return res.status(400).json({ error: 'Section key, name, and content required' });
  }

  // Stub: Database removed, returning success
  res.status(201).json({ success: true, id: 1, section_key, section_name, thai_content });
});

// Update content block (PROTECTED)
app.put('/api/content/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { thai_content } = req.body;

  if (!thai_content) {
    return res.status(400).json({ error: 'Content required' });
  }

  // Stub: Database removed, returning success
  res.json({ success: true, id, thai_content });
});

// --- WEBSITE IMAGES MANAGEMENT ROUTES ---
// Get all images (PUBLIC)
app.get('/api/images', (req, res) => {
  res.json([]);
});

// Get images by category (PUBLIC)
app.get('/api/images/:category', (req, res) => {
  res.json([]);
});

// Upload image (PROTECTED)
app.post('/api/images', requireAuth, upload.single('image'), (req, res) => {
  const { image_key, image_name, image_category, sort_order } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const mediaType = req.file?.mimetype.startsWith('video/') ? 'video' : 'image';

  if (!image_key || !image_name || !imagePath) {
    return res.status(400).json({ error: 'Image key, name, and file required' });
  }

  // Stub: Database removed, returning success
  res.status(201).json({
    success: true,
    id: 1,
    image_key,
    image_name,
    image_path: imagePath,
    image_category,
    sort_order: parseInt(sort_order) || 0,
    media_type: mediaType
  });
});

// Update image info (PROTECTED)
app.put('/api/images/:id', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { image_name, image_category, sort_order } = req.body;

  const imagePath = req.file ? `/uploads/${req.file.filename}` : '/default.png';
  const mediaType = req.file
    ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image')
    : 'image';

  // Stub: Database removed, returning success
  res.json({ success: true, id, image_name, image_path: imagePath, image_category, sort_order, media_type: mediaType });
});

// Delete image (PROTECTED)
app.delete('/api/images/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  // Stub: Database removed, returning success
  res.json({ success: true, changes: 1 });
});

// --- SERVICES MANAGEMENT ROUTES ---
// Get all visible services (PUBLIC)
app.get('/api/services', (req, res) => {
  res.json(appData.services);
});

// Get all services for admin (PROTECTED)
app.get('/api/services/all', requireAuth, (req, res) => {
  res.json(appData.services);
});

// Create new service (PROTECTED)
app.post('/api/services', requireAuth, (req, res) => {
  const { icon, title_thai, title_english, description_thai, description_english, sort_order } = req.body;

  if (!icon || !title_thai || !description_thai) {
    return res.status(400).json({ error: 'Icon, Thai title, and Thai description required' });
  }

  // Stub: Database removed, returning success
  res.status(201).json({
    success: true,
    id: appData.services.length + 1,
    icon,
    title_thai,
    title_english,
    description_thai,
    description_english,
    sort_order: parseInt(sort_order) || 0
  });
});

// Update service (PROTECTED)
app.put('/api/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { icon, title_thai, title_english, description_thai, description_english, sort_order, is_visible } = req.body;

  if (!icon || !title_thai || !description_thai) {
    return res.status(400).json({ error: 'Icon, Thai title, and Thai description required' });
  }

  // Stub: Database removed, returning success
  res.json({ success: true, id, icon, title_thai, description_thai, sort_order });
});

// Delete service (PROTECTED)
app.delete('/api/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  // Stub: Database removed, returning success
  res.json({ success: true, changes: 1 });
});

// --- WEBSITE SETTINGS ROUTES ---
// Get all settings (PUBLIC)
app.get('/api/settings', (req, res) => {
  res.json([]);
});

// Update setting (PROTECTED)
app.put('/api/settings/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  const { setting_value } = req.body;

  if (!setting_value) {
    return res.status(400).json({ error: 'Setting value required' });
  }

  // Stub: Database removed, returning success
  res.json({ success: true, setting_key: key, setting_value });
});

// PUT /api/projects/reorder — update sort_order for all projects
app.put('/api/projects/reorder', requireAuth, (req, res) => {
  const { order } = req.body; // array of { id, sort_order }
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid data' });
  // Stub: Database removed, returning success
  res.json({ success: true });
});

// ─── Notification Settings API ────────────────────────────────────
// GET all channels
app.get('/api/notifications/settings', requireAuth, (req, res) => {
  // Stub: Database removed, returning empty config
  const result = {
    email: { enabled: !!process.env.EMAIL_USER, config: {} },
    line: { enabled: !!process.env.LINE_CHANNEL_ACCESS_TOKEN, config: {} },
    facebook: { enabled: !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN, config: {} }
  };
  res.json(result);
});

// PUT update channel settings
app.put('/api/notifications/settings/:channel', requireAuth, (req, res) => {
  const { channel } = req.params;
  const { enabled, config } = req.body;
  // Stub: Database removed, returning success
  res.json({ success: true });
});

// POST test notification
app.post('/api/notifications/test/:channel', requireAuth, async (req, res) => {
  const { channel } = req.params;
  const testData = {
    name: 'ทดสอบระบบ',
    contact_info: '081-234-5678',
    email: 'test@example.com',
    message: 'นี่คือข้อความทดสอบจากระบบ BSBuildTh\nหากได้รับข้อความนี้ แสดงว่าระบบแจ้งเตือนทำงานถูกต้อง ✅'
  };
  let result;
  if (channel === 'email') result = await sendEmailNotification(testData);
  else if (channel === 'line') result = await sendLineNotification(testData);
  else if (channel === 'facebook') result = await sendFacebookNotification(testData);
  else return res.status(400).json({ error: 'Unknown channel' });
  res.json(result);
});

// ─── Reference Images API ───────────────────────────────────────
// GET /api/references - public, only visible
app.get('/api/references', (req, res) => {
  res.json([]);
});

// GET /api/references/all - admin only
app.get('/api/references/all', requireAuth, (req, res) => {
  res.json([]);
});

// POST /api/references - create
app.post('/api/references', requireAuth, upload.single('image'), (req, res) => {
  const { title, category, sort_order } = req.body;
  if (!title || !req.file) return res.status(400).json({ error: 'Title and image required' });
  const imgPath = `/uploads/${req.file.filename}`;
  // Stub: Database removed, returning success
  res.json({ id: 1, title, category, img_path: imgPath });
});

// PUT /api/references/:id - update
app.put('/api/references/:id', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, category, sort_order, is_visible } = req.body;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : '/default.png';
  // Stub: Database removed, returning success
  res.json({ success: true });
});

// DELETE /api/references/:id
app.delete('/api/references/:id', requireAuth, (req, res) => {
  // Stub: Database removed, returning success
  res.json({ success: true });
});

// ─── Website Menus API ───────────────────────────────────────
// GET all menus (PUBLIC)
app.get('/api/menus', (req, res) => {
  res.json(appData.menus);
});

// PUT update menu labels (PROTECTED)
app.put('/api/menus/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { label_thai, label_english } = req.body;
  if (!label_thai || !label_english) return res.status(400).json({ error: 'Labels required' });

  // Stub: Database removed, returning success
  res.json({ success: true, id, label_thai, label_english });
});

// Global error handler — catches multer errors (file too large, wrong type, etc.)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'ไฟล์ใหญ่เกิน 50 MB — กรุณาบีบอัดก่อนอัปโหลด' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err && err.message === 'Only image and video files are allowed') {
    return res.status(400).json({ error: 'รองรับเฉพาะไฟล์รูปภาพและวิดีโอเท่านั้น' });
  }
  if (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.1.41:${PORT}`);
});
