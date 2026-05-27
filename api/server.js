const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
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

// Database Setup
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err.message);
  else {
    console.log('Connected to the SQLite database.');
    initializeDb();
  }
});

function initializeDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      price TEXT DEFAULT '',
      img TEXT NOT NULL,
      category TEXT DEFAULT 'renovation',
      description TEXT DEFAULT ''
    )`, (err) => {
      if (!err) {
        // Add new columns if they don't exist (for existing DBs)
        db.run(`ALTER TABLE projects ADD COLUMN category TEXT DEFAULT 'renovation'`, () => {});
        db.run(`ALTER TABLE projects ADD COLUMN description TEXT DEFAULT ''`, () => {});
        db.run(`ALTER TABLE projects ADD COLUMN sort_order INTEGER DEFAULT 0`, () => {
          // Init sort_order from existing row order
          db.all('SELECT id FROM projects ORDER BY id ASC', (err, rows) => {
            if (!err) rows.forEach((r, i) => db.run('UPDATE projects SET sort_order=? WHERE id=?', [i, r.id]));
          });
        });

        // Seed default projects only if table is empty
        db.get('SELECT COUNT(*) as cnt FROM projects', (err, row) => {
          if (!err && row.cnt === 0) {
            const defaults = [
              ['ตกแต่งห้องนอนสมัยใหม่', 'interior', 'ปรับปรุงห้องนอนให้ดูทันสมัย ด้วยวัสดุคุณภาพสูงและการออกแบบที่ลงตัว', 'https://images.unsplash.com/photo-1505693314967-38190d70baf0?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=80'],
              ['ต่อเติมห้องนั่งเล่น', 'interior', 'ต่อเติมพื้นที่ห้องนั่งเล่นเพิ่มขนาดให้กว้างขึ้น', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=80'],
              ['รีโนเวทอพาร์ตเมนต์', 'renovation', 'รีโนเวทห้องพักทั้งห้อง เปลี่ยนพื้น ผนัง เพดาน และระบบไฟ', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=80'],
              ['ออกแบบและสร้างหลังคา', 'exterior', 'สร้างหลังคาโรงจอดรถและหลังคาบ้านใหม่ทั้งหลัง', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=80'],
              ['ตกแต่งห้องครัวยุโรป', 'interior', 'ออกแบบห้องครัวสไตล์ยุโรป พร้อมเคาน์เตอร์และตู้ครัวสำเร็จรูป', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=80'],
              ['ต่อเติมห้องน้ำหลัก', 'renovation', 'ปรับปรุงห้องน้ำใหม่ทั้งหมด เปลี่ยนกระเบื้อง สุขภัณฑ์ และระบบน้ำ', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=80']
            ];
            defaults.forEach(([title, category, description, img]) => {
              db.run('INSERT INTO projects (title, category, description, img) VALUES (?, ?, ?, ?)',
                [title, category, description, img]
              );
            });
            console.log('Default projects created');
          }
        });
      }
    });

    // Project process images table
    db.run(`CREATE TABLE IF NOT EXISTS project_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      img_path TEXT NOT NULL,
      caption TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`, (err) => {
      if (!err) console.log('Project images table ready');
    });

    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Check if default admin exists
        db.get('SELECT id FROM admins WHERE username = ?', ['admin'], (err, row) => {
          if (!row) {
            const hash = bcryptjs.hashSync('admin123', 10);
            db.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash], (err) => {
              if (!err) console.log('Default admin created: username=admin, password=admin123');
            });
          }
        });
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS calculator_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_name TEXT NOT NULL,
      base_price REAL NOT NULL,
      example_image_path TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Seed default calculator types
        db.get('SELECT COUNT(*) as count FROM calculator_types', (err, row) => {
          if (row && row.count === 0) {
            const defaults = [
              ['Interior (ห้องชั้นใน)', 5000, 1],
              ['Exterior (หน้าบ้าน)', 3000, 2],
              ['Roof/Garage (หลังคา/โรงจอด)', 8000, 3],
              ['Full Renovation (รีโนเวท)', 6000, 4]
            ];
            defaults.forEach(([name, price, order]) => {
              db.run('INSERT INTO calculator_types (type_name, base_price, sort_order) VALUES (?, ?, ?)',
                [name, price, order]
              );
            });
            console.log('Default calculator types created');
          }
        });
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      stars INTEGER NOT NULL DEFAULT 5,
      is_visible BOOLEAN NOT NULL DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Seed default reviews
        db.get('SELECT COUNT(*) as count FROM reviews', (err, row) => {
          if (row && row.count === 0) {
            const defaults = [
              ['Chalee Pattarachinda', 'Home Owner', 'พวกเขาสร้างรูปเป้าหมายสำหรับโครงการของเรา การสื่อสารตลอดเวลา...', 5, 1, 1],
              ['Wanida Sompromma', 'Apartment Manager', 'คุณภาพการทำงานนั้นเป็นเลิศ ทีมงานมืออาชีพ...', 5, 1, 2],
              ['Pranee Jutapun', 'Business Owner', 'พอใจกับผลงาน ราคาเหมาะสม แนะนำเป็นอย่างยิ่ง...', 5, 1, 3]
            ];
            defaults.forEach(([name, role, text, stars, is_visible, order]) => {
              db.run('INSERT INTO reviews (name, role, text, stars, is_visible, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
                [name, role, text, stars, is_visible, order]
              );
            });
            console.log('Default reviews created');
          }
        });
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS business_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      line_id TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Add company_name column if it doesn't exist (for existing databases)
        db.run(`ALTER TABLE business_info ADD COLUMN company_name TEXT`, (alterErr) => {
          // Ignore error if column already exists
        });

        // Seed default business info
        db.get('SELECT COUNT(*) as count FROM business_info', (err, row) => {
          if (row && row.count === 0) {
            db.run('INSERT INTO business_info (company_name, address, phone, email, line_id) VALUES (?, ?, ?, ?, ?)',
              ['ทีมผู้รับเหมา', '', '', '', '']
            );
            console.log('Default business info created');
          }
        });
      }
    });

    // Website Content Management Table
    db.run(`CREATE TABLE IF NOT EXISTS website_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL UNIQUE,
      section_name TEXT NOT NULL,
      thai_content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Seed default content
        const defaultContent = [
          ['hero_title', 'Hero Title', 'ทีมผู้รับเหมา'],
          ['hero_subtitle', 'Hero Subtitle', 'PROFESSIONAL CONSTRUCTION'],
          ['hero_description', 'Hero Description', 'ระบบประเมินราคาอัจฉริยะเบื้องต้น ช่วยให้คุณวางแผนงบประมาณได้อย่างแม่นยำ'],
          ['about_description', 'About Us Description', 'เราคือทีมผู้รับเหมาที่มีประสบการณ์ยาวนานกว่า 30 ปี มุ่งมั่นสร้างสรรค์ผลงานคุณภาพด้วยมาตรฐานสูงสุด'],
          ['services_intro', 'Services Section Intro', 'บริการของเรา'],
          ['footer_cta', 'Footer CTA Text', 'Let\'s Create Something Exceptional'],
          ['footer_description', 'Footer Description', 'ระบบขอใบเสนอราคาออนไลน์ กรอกข้อมูลเพื่อให้เราติดต่อกลับพร้อมประเมินราคาให้ฟรี']
        ];

        defaultContent.forEach(([key, name, content]) => {
          db.run('INSERT OR IGNORE INTO website_content (section_key, section_name, thai_content) VALUES (?, ?, ?)',
            [key, name, content]
          );
        });
        console.log('Default website content seeded');
      }
    });

    // Website Images Management Table
    db.run(`CREATE TABLE IF NOT EXISTS website_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_key TEXT NOT NULL UNIQUE,
      image_name TEXT NOT NULL,
      image_path TEXT NOT NULL,
      image_category TEXT,
      sort_order INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        db.run(`ALTER TABLE website_images ADD COLUMN media_type TEXT DEFAULT 'image'`, () => {
          db.run(`INSERT OR IGNORE INTO website_images (image_key, image_name, image_path, image_category, media_type)
                  VALUES ('hero_background', 'Hero Background', '/hero_bg.png', 'hero', 'image')`);
        });
        console.log('Website images table created');
      }
    });

    // Services Table (to replace hardcoded services)
    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      icon TEXT NOT NULL,
      title_thai TEXT NOT NULL,
      title_english TEXT,
      description_thai TEXT NOT NULL,
      description_english TEXT,
      sort_order INTEGER DEFAULT 0,
      is_visible BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Seed default services
        db.get('SELECT COUNT(*) as count FROM services', (err, row) => {
          if (row && row.count === 0) {
            const defaults = [
              ['🎨', 'ออกแบบสถาปัตยกรรม', 'Architecture Design', 'ออกแบบและวางแผนโครงการด้วยมาตรฐานสูง', 'Design and plan projects with high standards', 1],
              ['🔨', 'ก่อสร้าง', 'Construction', 'ก่อสร้างโครงสร้างและพื้นฐานที่แข็งแรง', 'Build strong structural foundations', 2],
              ['🪟', 'งานสิ่งปลูกสร้าง', 'Installation', 'ติดตั้งหน้าต่างประตูและระบบต่างๆ', 'Install windows, doors and systems', 3],
              ['🛠️', 'งานติดตั้ง', 'Fixtures', 'ติดตั้งระบบงานภายนอกและอุปกรณ์', 'Install exterior systems and fixtures', 4],
              ['🎪', 'ตกแต่งภายใน', 'Interior Design', 'ตกแต่งภายในและออกแบบสไตล์ห้อง', 'Interior decoration and room styling', 5],
              ['✨', 'เสร็จสิ้น', 'Finishing', 'ทำความสะอาดและตรวจสอบสุดท้าย', 'Final cleaning and inspection', 6]
            ];
            defaults.forEach(([icon, title_thai, title_eng, desc_thai, desc_eng, order]) => {
              db.run('INSERT INTO services (icon, title_thai, title_english, description_thai, description_english, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
                [icon, title_thai, title_eng, desc_thai, desc_eng, order]
              );
            });
            console.log('Default services created');
          }
        });
      }
    });

    // Reference Images Table
    db.run(`CREATE TABLE IF NOT EXISTS reference_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'ทั่วไป',
      img_path TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_visible BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        db.get('SELECT COUNT(*) as cnt FROM reference_images', (e, row) => {
          if (!e && row.cnt === 0) {
            const seeds = [
              ['ห้องนั่งเล่นสไตล์โมเดิร์น', 'ห้องนั่งเล่น'],
              ['ห้องนอนมินิมอล', 'ห้องนอน'],
              ['ห้องครัวเปิด', 'ห้องครัว'],
              ['ห้องน้ำหรู', 'ห้องน้ำ'],
              ['ระเบียงบ้าน', 'ภายนอก'],
            ];
            seeds.forEach(([title, cat], i) => {
              db.run('INSERT INTO reference_images (title, category, img_path, sort_order) VALUES (?, ?, ?, ?)',
                [title, cat, '/project_1.png', i]);
            });
          }
        });
      }
    });

    // Notification Settings Table
    db.run(`CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL UNIQUE,
      enabled BOOLEAN DEFAULT 0,
      config TEXT DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        const channels = ['email', 'line', 'facebook'];
        channels.forEach(ch => {
          db.run('INSERT OR IGNORE INTO notification_settings (channel, enabled, config) VALUES (?, 0, ?)',
            [ch, '{}']);
        });
        // Migrate existing .env config into DB if present
        if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
          db.run(`UPDATE notification_settings SET enabled=1, config=? WHERE channel='email'`,
            [JSON.stringify({ email_user: process.env.EMAIL_USER, email_password: process.env.EMAIL_PASSWORD, notify_to: process.env.EMAIL_USER })]);
        }
        if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_ADMIN_USER_ID) {
          db.run(`UPDATE notification_settings SET enabled=1, config=? WHERE channel='line'`,
            [JSON.stringify({ channel_access_token: process.env.LINE_CHANNEL_ACCESS_TOKEN, admin_user_id: process.env.LINE_ADMIN_USER_ID })]);
        }
      }
    });

    // Website Settings Table
    db.run(`CREATE TABLE IF NOT EXISTS website_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      setting_type TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Seed default settings
        const defaults = [
          ['projects_count', '500', 'number'],
          ['team_count', '30', 'number'],
          ['satisfaction_percent', '95', 'number'],
          ['company_description_short', 'Full Construction & Renovation Services', 'text']
        ];

        defaults.forEach(([key, value, type]) => {
          db.run('INSERT OR IGNORE INTO website_settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?)',
            [key, value, type]
          );
        });
        console.log('Default website settings seeded');
      }
    });

    // Website Menus Table
    db.run(`CREATE TABLE IF NOT EXISTS website_menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_key TEXT NOT NULL UNIQUE,
      label_thai TEXT NOT NULL,
      label_english TEXT NOT NULL,
      link_url TEXT NOT NULL,
      is_cta BOOLEAN DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        db.get('SELECT COUNT(*) as cnt FROM website_menus', (e, row) => {
          if (!e && row.cnt === 0) {
            const menus = [
              ['services', 'บริการ', 'Services', '#services', 0, 1],
              ['calculator', 'ประเมินราคา', 'Estimate', '#calculator', 0, 2],
              ['projects', 'ผลงาน', 'Projects', '#projects', 0, 3],
              ['reference', 'Reference', 'Reference', '#reference', 0, 4],
              ['reviews', 'รีวิว', 'Reviews', '#reviews', 0, 5],
              ['about', 'เกี่ยวกับเรา', 'About Us', '#about', 0, 6],
              ['cta', 'ขอใบเสนอราคา', 'Get a Quote', '#contact', 1, 7]
            ];
            menus.forEach(([key, th, en, link, is_cta, order]) => {
              db.run('INSERT INTO website_menus (menu_key, label_thai, label_english, link_url, is_cta, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
                [key, th, en, link, is_cta, order]);
            });
            console.log('Default menus seeded');
          }
        });
      }
    });
  });
}

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.admin) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Helper: Get notification config from DB
function getNotifConfig(channel) {
  return new Promise((resolve) => {
    db.get('SELECT enabled, config FROM notification_settings WHERE channel = ?', [channel], (err, row) => {
      if (err || !row || !row.enabled) return resolve(null);
      try { resolve(JSON.parse(row.config)); } catch { resolve(null); }
    });
  });
}

// Helper: Format inquiry message
function formatMessage(contactData) {
  return `📬 ลูกค้าใหม่ขอใบเสนอราคา!\n\n👤 ชื่อ: ${contactData.name}\n📞 ติดต่อ: ${contactData.contact_info}\n📧 Email: ${contactData.email}\n\n💬 รายละเอียด:\n${contactData.message}`;
}

// Helper: Send email notification
async function sendEmailNotification(contactData) {
  const cfg = await getNotifConfig('email');
  if (!cfg || !cfg.email_user || !cfg.email_password) {
    console.log('Email not configured, skipping');
    return { ok: false, error: 'Not configured' };
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: cfg.email_user, pass: cfg.email_password }
  });
  const mailOptions = {
    from: cfg.email_user,
    to: cfg.notify_to || cfg.email_user,
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
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent');
    return { ok: true };
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    return { ok: false, error: err.message };
  }
}

// Helper: Send LINE notification
async function sendLineNotification(contactData) {
  const cfg = await getNotifConfig('line');
  if (!cfg || !cfg.channel_access_token || !cfg.admin_user_id) {
    console.log('LINE not configured, skipping');
    return { ok: false, error: 'Not configured' };
  }
  const client = new messagingApi.MessagingApiClient({ channelAccessToken: cfg.channel_access_token });
  try {
    await client.pushMessage({
      to: cfg.admin_user_id,
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
  const cfg = await getNotifConfig('facebook');
  if (!cfg || !cfg.page_access_token || !cfg.admin_psid) {
    console.log('Facebook not configured, skipping');
    return { ok: false, error: 'Not configured' };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${cfg.page_access_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: cfg.admin_psid },
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
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!admin || !bcryptjs.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.admin = { id: admin.id, username: admin.username };
    res.json({ success: true, message: 'Login successful' });
  });
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
  db.all('SELECT id, title, img, category, description, sort_order FROM projects ORDER BY sort_order ASC, id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM projects WHERE id = ?', [id], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    db.all('SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC', [id], (err2, images) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ ...project, process_images: images });
    });
  });
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

  const query = 'INSERT INTO projects (title, price, img, category, description) VALUES (?, ?, ?, ?, ?)';
  db.run(query, [title, '', imgPath, category || 'renovation', description || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ success: true, id: this.lastID, img: imgPath });
  });
});

app.put('/api/projects/:id', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, category, description } = req.body;

  if (!title) return res.status(400).json({ error: 'Title required' });

  db.get('SELECT img FROM projects WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Project not found' });
    const imgPath = req.file ? `/uploads/${req.file.filename}` : row.img;
    db.run('UPDATE projects SET title=?, img=?, category=?, description=? WHERE id=?',
      [title, imgPath, category || 'renovation', description || '', id],
      function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true, img: imgPath });
      }
    );
  });
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM projects WHERE id = ?', id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// Project process images
app.post('/api/projects/:id/images', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { caption, sort_order } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const imgPath = `/uploads/${req.file.filename}`;
  db.run('INSERT INTO project_images (project_id, img_path, caption, sort_order) VALUES (?, ?, ?, ?)',
    [id, imgPath, caption || '', sort_order || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true, id: this.lastID, img_path: imgPath });
    }
  );
});

app.delete('/api/projects/:id/images/:imgId', requireAuth, (req, res) => {
  const { imgId } = req.params;
  db.run('DELETE FROM project_images WHERE id = ?', [imgId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- CALCULATOR TYPES ROUTES ---
// Get all calculator types (PUBLIC - no auth required)
app.get('/api/calculator/types', (req, res) => {
  db.all('SELECT id, type_name, base_price, example_image_path, sort_order FROM calculator_types ORDER BY sort_order ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new calculator type
app.post('/api/calculator/types', requireAuth, upload.single('image'), (req, res) => {
  const { type_name, base_price, sort_order } = req.body;
  const imagePath = req.file ? `/uploads/calculator/${req.file.filename}` : null;

  if (!type_name || !base_price) {
    return res.status(400).json({ error: 'Type name and base price required' });
  }

  const query = 'INSERT INTO calculator_types (type_name, base_price, example_image_path, sort_order) VALUES (?, ?, ?, ?)';
  db.run(query, [type_name, parseFloat(base_price), imagePath, parseInt(sort_order) || 0], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      success: true,
      id: this.lastID,
      type_name,
      base_price: parseFloat(base_price),
      example_image_path: imagePath,
      sort_order: parseInt(sort_order) || 0
    });
  });
});

// Update calculator type
app.put('/api/calculator/types/:id', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { type_name, base_price, sort_order } = req.body;

  if (!type_name || !base_price) {
    return res.status(400).json({ error: 'Type name and base price required' });
  }

  // If new image uploaded, update path; otherwise keep existing
  db.get('SELECT example_image_path FROM calculator_types WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    const imagePath = req.file ? `/uploads/calculator/${req.file.filename}` : row?.example_image_path;
    const query = 'UPDATE calculator_types SET type_name = ?, base_price = ?, example_image_path = ?, sort_order = ? WHERE id = ?';

    db.run(query, [type_name, parseFloat(base_price), imagePath, parseInt(sort_order) || 0, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        success: true,
        id,
        type_name,
        base_price: parseFloat(base_price),
        example_image_path: imagePath,
        sort_order: parseInt(sort_order) || 0
      });
    });
  });
});

// Delete calculator type
app.delete('/api/calculator/types/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM calculator_types WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// --- REVIEWS ROUTES ---
// Get all visible reviews (PUBLIC)
app.get('/api/reviews', (req, res) => {
  db.all('SELECT id, name, role, text, stars, sort_order FROM reviews WHERE is_visible = 1 ORDER BY sort_order ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get all reviews for admin (PROTECTED)
app.get('/api/reviews/all', requireAuth, (req, res) => {
  db.all('SELECT id, name, role, text, stars, is_visible, sort_order FROM reviews ORDER BY sort_order ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new review (PROTECTED)
app.post('/api/reviews', requireAuth, (req, res) => {
  const { name, role, text, stars, is_visible } = req.body;

  if (!name || !role || !text) {
    return res.status(400).json({ error: 'Name, role, and text required' });
  }

  const query = 'INSERT INTO reviews (name, role, text, stars, is_visible, sort_order) VALUES (?, ?, ?, ?, ?, ?)';
  const starsNum = parseInt(stars) || 5;
  const isVisibleBool = is_visible !== false ? 1 : 0;
  const sortOrder = 0;

  db.run(query, [name, role, text, starsNum, isVisibleBool, sortOrder], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      success: true,
      id: this.lastID,
      name,
      role,
      text,
      stars: starsNum,
      is_visible: isVisibleBool,
      sort_order: sortOrder
    });
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

  const query = 'UPDATE reviews SET name = ?, role = ?, text = ?, stars = ?, is_visible = ?, sort_order = ? WHERE id = ?';
  db.run(query, [name, role, text, starsNum, isVisibleBool, sortNum, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
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
});

// Delete review (PROTECTED)
app.delete('/api/reviews/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM reviews WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// --- BUSINESS INFO ROUTES ---
// Get business info (PUBLIC)
app.get('/api/business-info', (req, res) => {
  db.get('SELECT * FROM business_info LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

// Update business info (PROTECTED - admin only)
app.put('/api/business-info', requireAuth, (req, res) => {
  const { company_name, address, phone, email, line_id } = req.body;

  const query = 'UPDATE business_info SET company_name = ?, address = ?, phone = ?, email = ?, line_id = ?, updated_at = CURRENT_TIMESTAMP';
  db.run(query, [company_name, address, phone, email, line_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success: true,
      company_name,
      address,
      phone,
      email,
      line_id
    });
  });
});

// --- WEBSITE CONTENT MANAGEMENT ROUTES ---
// Get all content (PUBLIC)
app.get('/api/content', (req, res) => {
  db.all('SELECT id, section_key, section_name, thai_content, updated_at FROM website_content ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get specific content block (PUBLIC)
app.get('/api/content/:section_key', (req, res) => {
  const { section_key } = req.params;
  db.get('SELECT id, section_key, section_name, thai_content, updated_at FROM website_content WHERE section_key = ?', [section_key], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

// Create new content block (PROTECTED)
app.post('/api/content', requireAuth, (req, res) => {
  const { section_key, section_name, thai_content } = req.body;

  if (!section_key || !section_name || !thai_content) {
    return res.status(400).json({ error: 'Section key, name, and content required' });
  }

  const query = 'INSERT INTO website_content (section_key, section_name, thai_content) VALUES (?, ?, ?)';
  db.run(query, [section_key, section_name, thai_content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ success: true, id: this.lastID, section_key, section_name, thai_content });
  });
});

// Update content block (PROTECTED)
app.put('/api/content/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { thai_content } = req.body;

  if (!thai_content) {
    return res.status(400).json({ error: 'Content required' });
  }

  const query = 'UPDATE website_content SET thai_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  db.run(query, [thai_content, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id, thai_content });
  });
});

// --- WEBSITE IMAGES MANAGEMENT ROUTES ---
// Get all images (PUBLIC)
app.get('/api/images', (req, res) => {
  const { category } = req.query;
  const sql = category
    ? 'SELECT id, image_key, image_name, image_path, image_category, sort_order, media_type FROM website_images WHERE image_category = ? ORDER BY sort_order ASC'
    : 'SELECT id, image_key, image_name, image_path, image_category, sort_order, media_type FROM website_images ORDER BY sort_order ASC';
  const params = category ? [category] : [];
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get images by category (PUBLIC)
app.get('/api/images/:category', (req, res) => {
  const { category } = req.params;
  db.all('SELECT id, image_key, image_name, image_path, image_category, sort_order, media_type FROM website_images WHERE image_category = ? ORDER BY sort_order ASC', [category], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Upload image (PROTECTED)
app.post('/api/images', requireAuth, upload.single('image'), (req, res) => {
  const { image_key, image_name, image_category, sort_order } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const mediaType = req.file?.mimetype.startsWith('video/') ? 'video' : 'image';

  if (!image_key || !image_name || !imagePath) {
    return res.status(400).json({ error: 'Image key, name, and file required' });
  }

  const query = 'INSERT INTO website_images (image_key, image_name, image_path, image_category, sort_order, media_type) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(query, [image_key, image_name, imagePath, image_category, parseInt(sort_order) || 0, mediaType], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      success: true,
      id: this.lastID,
      image_key,
      image_name,
      image_path: imagePath,
      image_category,
      sort_order: parseInt(sort_order) || 0,
      media_type: mediaType
    });
  });
});

// Update image info (PROTECTED)
app.put('/api/images/:id', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { image_name, image_category, sort_order } = req.body;

  db.get('SELECT image_path, media_type FROM website_images WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    const imagePath = req.file ? `/uploads/${req.file.filename}` : row?.image_path;
    const mediaType = req.file
      ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image')
      : (row?.media_type || 'image');

    const query = 'UPDATE website_images SET image_name = ?, image_path = ?, image_category = ?, sort_order = ?, media_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    db.run(query, [image_name, imagePath, image_category, parseInt(sort_order) || 0, mediaType, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id, image_name, image_path: imagePath, image_category, sort_order, media_type: mediaType });
    });
  });
});

// Delete image (PROTECTED)
app.delete('/api/images/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM website_images WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// --- SERVICES MANAGEMENT ROUTES ---
// Get all visible services (PUBLIC)
app.get('/api/services', (req, res) => {
  db.all('SELECT id, icon, title_thai, title_english, description_thai, description_english, sort_order FROM services WHERE is_visible = 1 ORDER BY sort_order ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get all services for admin (PROTECTED)
app.get('/api/services/all', requireAuth, (req, res) => {
  db.all('SELECT id, icon, title_thai, title_english, description_thai, description_english, sort_order, is_visible FROM services ORDER BY sort_order ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new service (PROTECTED)
app.post('/api/services', requireAuth, (req, res) => {
  const { icon, title_thai, title_english, description_thai, description_english, sort_order } = req.body;

  if (!icon || !title_thai || !description_thai) {
    return res.status(400).json({ error: 'Icon, Thai title, and Thai description required' });
  }

  const query = 'INSERT INTO services (icon, title_thai, title_english, description_thai, description_english, sort_order) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(query, [icon, title_thai, title_english || '', description_thai, description_english || '', parseInt(sort_order) || 0], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      success: true,
      id: this.lastID,
      icon,
      title_thai,
      title_english,
      description_thai,
      description_english,
      sort_order: parseInt(sort_order) || 0
    });
  });
});

// Update service (PROTECTED)
app.put('/api/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { icon, title_thai, title_english, description_thai, description_english, sort_order, is_visible } = req.body;

  if (!icon || !title_thai || !description_thai) {
    return res.status(400).json({ error: 'Icon, Thai title, and Thai description required' });
  }

  const query = 'UPDATE services SET icon = ?, title_thai = ?, title_english = ?, description_thai = ?, description_english = ?, sort_order = ?, is_visible = ? WHERE id = ?';
  db.run(query, [icon, title_thai, title_english || '', description_thai, description_english || '', parseInt(sort_order) || 0, is_visible !== false ? 1 : 0, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id, icon, title_thai, description_thai, sort_order });
  });
});

// Delete service (PROTECTED)
app.delete('/api/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM services WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// --- WEBSITE SETTINGS ROUTES ---
// Get all settings (PUBLIC)
app.get('/api/settings', (req, res) => {
  db.all('SELECT setting_key, setting_value, setting_type FROM website_settings ORDER BY setting_key ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update setting (PROTECTED)
app.put('/api/settings/:key', requireAuth, (req, res) => {
  const { key } = req.params;
  const { setting_value } = req.body;

  if (!setting_value) {
    return res.status(400).json({ error: 'Setting value required' });
  }

  const query = 'UPDATE website_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?';
  db.run(query, [setting_value, key], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, setting_key: key, setting_value });
  });
});

// PUT /api/projects/reorder — update sort_order for all projects
app.put('/api/projects/reorder', requireAuth, (req, res) => {
  const { order } = req.body; // array of { id, sort_order }
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid data' });
  const stmt = db.prepare('UPDATE projects SET sort_order=? WHERE id=?');
  order.forEach(({ id, sort_order }) => stmt.run(sort_order, id));
  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ─── Notification Settings API ────────────────────────────────────
// GET all channels
app.get('/api/notifications/settings', requireAuth, (req, res) => {
  db.all('SELECT channel, enabled, config FROM notification_settings', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = {};
    rows.forEach(r => {
      try { result[r.channel] = { enabled: !!r.enabled, config: JSON.parse(r.config) }; }
      catch { result[r.channel] = { enabled: !!r.enabled, config: {} }; }
    });
    res.json(result);
  });
});

// PUT update channel settings
app.put('/api/notifications/settings/:channel', requireAuth, (req, res) => {
  const { channel } = req.params;
  const { enabled, config } = req.body;
  db.run(
    `INSERT INTO notification_settings (channel, enabled, config, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(channel) DO UPDATE SET enabled=excluded.enabled, config=excluded.config, updated_at=CURRENT_TIMESTAMP`,
    [channel, enabled ? 1 : 0, JSON.stringify(config || {})],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
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
  db.all('SELECT * FROM reference_images WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/references/all - admin only
app.get('/api/references/all', requireAuth, (req, res) => {
  db.all('SELECT * FROM reference_images ORDER BY sort_order ASC, id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/references - create
app.post('/api/references', requireAuth, upload.single('image'), (req, res) => {
  const { title, category, sort_order } = req.body;
  if (!title || !req.file) return res.status(400).json({ error: 'Title and image required' });
  const imgPath = `/uploads/${req.file.filename}`;
  db.run('INSERT INTO reference_images (title, category, img_path, sort_order) VALUES (?, ?, ?, ?)',
    [title, category || 'ทั่วไป', imgPath, sort_order || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, category, img_path: imgPath });
    }
  );
});

// PUT /api/references/:id - update
app.put('/api/references/:id', requireAuth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, category, sort_order, is_visible } = req.body;
  db.get('SELECT * FROM reference_images WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Not found' });
    const imgPath = req.file ? `/uploads/${req.file.filename}` : row.img_path;
    db.run('UPDATE reference_images SET title=?, category=?, img_path=?, sort_order=?, is_visible=? WHERE id=?',
      [title || row.title, category || row.category, imgPath,
       sort_order !== undefined ? sort_order : row.sort_order,
       is_visible !== undefined ? is_visible : row.is_visible, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });
});

// DELETE /api/references/:id
app.delete('/api/references/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM reference_images WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ─── Website Menus API ───────────────────────────────────────
// GET all menus (PUBLIC)
app.get('/api/menus', (req, res) => {
  db.all('SELECT * FROM website_menus ORDER BY sort_order ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// PUT update menu labels (PROTECTED)
app.put('/api/menus/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { label_thai, label_english } = req.body;
  if (!label_thai || !label_english) return res.status(400).json({ error: 'Labels required' });

  db.run('UPDATE website_menus SET label_thai = ?, label_english = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [label_thai, label_english, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id, label_thai, label_english });
    }
  );
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
