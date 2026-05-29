import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import './Admin.css';
import {
  getProjects, getProject, getAllReviews, getCalculatorTypes, getServices,
  getBusinessInfo, getAllContent, getSettings, getAllReferences, getMenus,
  getImages, getContacts, addItem, updateItem, deleteItem, setItem,
  fileToResizedDataURL,
} from '../firebase/api';

// Old image paths are absolute (/website/uploads/..) or data URLs — both render
// as-is, so the base prefix used throughout the JSX is empty now.
const API = '';

const Admin = ({ setIsAuthenticated }) => {
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [projectCategory, setProjectCategory] = useState('renovation');
  const [projectDescription, setProjectDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [managingImagesForProject, setManagingImagesForProject] = useState(null);
  const [processImageFile, setProcessImageFile] = useState(null);
  const [processImageCaption, setProcessImageCaption] = useState('');
  const [projectProcessImages, setProjectProcessImages] = useState([]);
  const [calculatorTypes, setCalculatorTypes] = useState([]);
  const [calcTypeName, setCalcTypeName] = useState('');
  const [calcTypePrice, setCalcTypePrice] = useState('');
  const [calcTypeImage, setCalcTypeImage] = useState(null);
  const [calcTypeSortOrder, setCalcTypeSortOrder] = useState('0');
  const [editingCalcTypeId, setEditingCalcTypeId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRole, setReviewRole] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewStars, setReviewStars] = useState('5');
  const [reviewVisible, setReviewVisible] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [businessInfo, setBusinessInfo] = useState({
    company_name: '',
    address: '',
    phone: '',
    email: '',
    line_id: '',
    messenger_url: ''
  });
  const [websiteContent, setWebsiteContent] = useState([]);
  const [contentKey, setContentKey] = useState('');
  const [contentName, setContentName] = useState('');
  const [contentValue, setContentValue] = useState('');
  const [editingContentId, setEditingContentId] = useState(null);
  const [dbServices, setDbServices] = useState([]);
  const [serviceIcon, setServiceIcon] = useState('');
  const [serviceTitleThai, setServiceTitleThai] = useState('');
  const [serviceDescThai, setServiceDescThai] = useState('');
  const [serviceSortOrder, setServiceSortOrder] = useState('0');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [websiteSettings, setWebsiteSettings] = useState({
    projects_count: '500',
    team_count: '30',
    satisfaction_percent: '95'
  });
  const [heroBgImage, setHeroBgImage] = useState(null);
  const [heroBgFile, setHeroBgFile] = useState(null);
  const [heroBgUploading, setHeroBgUploading] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    email:    { enabled: false, config: { email_user: '', email_password: '', notify_to: '' } },
    line:     { enabled: false, config: { channel_access_token: '', admin_user_id: '' } },
    facebook: { enabled: false, config: { page_access_token: '', admin_psid: '' } }
  });
  const [notifTestResult, setNotifTestResult] = useState({});
  const [notifTesting, setNotifTesting] = useState({});
  const [references, setReferences] = useState([]);
  const [refTitle, setRefTitle] = useState('');
  const [refCategory, setRefCategory] = useState('ทั่วไป');
  const [refImage, setRefImage] = useState(null);
  const [refSortOrder, setRefSortOrder] = useState('0');
  const [editingRefId, setEditingRefId] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [menus, setMenus] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchContacts();
    fetchCalculatorTypes();
    fetchReviews();
    fetchBusinessInfo();
    fetchWebsiteContent();
    fetchDatabaseServices();
    fetchWebsiteSettings();
    fetchReferences();
    fetchNotifSettings();
    fetchMenus();
    fetchHeroBg();
  }, []);

  const fetchHeroBg = () => {
    getImages('hero')
      .then(data => {
        const bg = Array.isArray(data) ? data.find(i => i.image_key === 'hero_background') : null;
        if (bg) setHeroBgImage(bg);
      })
      .catch(err => console.error(err));
  };

  const handleUploadHeroBg = async () => {
    if (!heroBgFile) { alert('กรุณาเลือกไฟล์รูปก่อน'); return; }
    setHeroBgUploading(true);
    try {
      const isVideo = heroBgFile.type.startsWith('video/');
      const dataUrl = await fileToResizedDataURL(heroBgFile, 1600, 0.82);
      await setItem('images', 'hero_background', {
        image_key: 'hero_background',
        image_category: 'hero',
        image_path: dataUrl,
        media_type: isVideo ? 'video' : 'image',
        sort_order: 0,
      });
      alert('✅ อัปเดตรูป Hero Background สำเร็จ! กรุณา reload หน้าเว็บเพื่อดูผล');
      setHeroBgFile(null);
      fetchHeroBg();
    } catch (err) {
      alert('❌ ' + err.message);
    }
    setHeroBgUploading(false);
  };

  const fetchMenus = () => {
    getMenus().then(data => setMenus(data)).catch(err => console.error(err));
  };

  const handleUpdateMenu = async (id, thai, eng) => {
    try {
      await updateItem('menus', id, { label_thai: thai, label_english: eng });
      alert('Menu updated successfully!');
      fetchMenus();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWebsiteContent = () => {
    getAllContent().then(data => setWebsiteContent(data)).catch(err => console.error(err));
  };

  const fetchDatabaseServices = () => {
    getServices().then(data => setDbServices(data)).catch(err => console.error(err));
  };

  const fetchWebsiteSettings = () => {
    getSettings()
      .then(data => {
        const settingsObj = {};
        data.forEach(s => { settingsObj[s.setting_key] = s.setting_value; });
        setWebsiteSettings(settingsObj);
      })
      .catch(err => console.error(err));
  };

  const fetchReferences = () => {
    getAllReferences().then(data => setReferences(data)).catch(err => console.error(err));
  };

  // Notifications run server-side (email/LINE/FB) and aren't available on the
  // serverless static host — the section is hidden in the JSX below.
  const fetchNotifSettings = () => {};
  const handleSaveNotif = async () => {};
  const handleTestNotif = async () => {};

  const updateNotifConfig = (channel, field, value) => {
    setNotifSettings(prev => ({
      ...prev,
      [channel]: { ...prev[channel], config: { ...prev[channel].config, [field]: value } }
    }));
  };

  const handleAddReference = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: refTitle,
        category: refCategory,
        sort_order: parseInt(refSortOrder) || 0,
      };
      if (refImage) payload.img_path = await fileToResizedDataURL(refImage);
      if (editingRefId) {
        await updateItem('references', editingRefId, payload);
      } else {
        await addItem('references', { ...payload, is_visible: 1 });
      }
      setRefTitle(''); setRefCategory('ทั่วไป'); setRefImage(null);
      setRefSortOrder('0'); setEditingRefId(null);
      fetchReferences();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const handleEditReference = (ref) => {
    setEditingRefId(ref.id);
    setRefTitle(ref.title);
    setRefCategory(ref.category);
    setRefSortOrder(String(ref.sort_order));
    setRefImage(null);
    window.scrollTo({ top: document.getElementById('ref-form')?.offsetTop - 80, behavior: 'smooth' });
  };

  const handleDeleteReference = async (id) => {
    if (!window.confirm('ลบรูป Reference นี้?')) return;
    await deleteItem('references', id);
    fetchReferences();
  };

  const handleToggleRefVisible = async (ref) => {
    await updateItem('references', ref.id, { is_visible: ref.is_visible ? 0 : 1 });
    fetchReferences();
  };

  const fetchProjects = () => {
    getProjects().then(data => setProjects(data)).catch(err => console.error(err));
  };

  const fetchContacts = () => {
    getContacts().then(data => setContacts(data)).catch(err => console.error(err));
  };

  const fetchCalculatorTypes = () => {
    getCalculatorTypes().then(data => setCalculatorTypes(data)).catch(err => console.error(err));
  };

  const fetchReviews = () => {
    getAllReviews().then(data => setReviews(data)).catch(err => console.error(err));
  };

  const fetchBusinessInfo = () => {
    getBusinessInfo()
      .then(data => {
        setBusinessInfo({
          company_name: data.company_name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          line_id: data.line_id || '',
          messenger_url: data.messenger_url || ''
        });
      })
      .catch(err => console.error(err));
  };

  const handleAddProject = async (e) => {
    e.preventDefault();

    if (!title) { alert('กรุณาใส่ชื่อโครงการ'); return; }
    if (!editingProjectId && !imageFile) { alert('กรุณาเลือกรูปภาพ'); return; }

    try {
      const payload = {
        title,
        category: projectCategory,
        description: projectDescription,
      };
      if (imageFile) payload.img = await fileToResizedDataURL(imageFile);
      if (editingProjectId) {
        await updateItem('projects', editingProjectId, payload);
      } else {
        await addItem('projects', { ...payload, sort_order: projects.length, process_images: [] });
      }
      setTitle(''); setImageFile(null); setProjectCategory('renovation');
      setProjectDescription(''); setEditingProjectId(null);
      fetchProjects();
      alert('✅ บันทึกสำเร็จ!');
    } catch (err) {
      console.error(err);
      alert('❌ เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleEditProject = (p) => {
    setEditingProjectId(p.id);
    setTitle(p.title);
    setProjectCategory(p.category || 'renovation');
    setProjectDescription(p.description || '');
    setImageFile(null);
    window.scrollTo({ top: document.querySelector('.admin-section').offsetTop - 80, behavior: 'smooth' });
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setTitle(''); setImageFile(null);
    setProjectCategory('renovation'); setProjectDescription('');
  };

  const dragProjectIdx = React.useRef(null);
  const dragOverProjectIdx = React.useRef(null);
  const [dragOverId, setDragOverId] = React.useState(null);

  const handleProjectDragStart = (idx) => {
    dragProjectIdx.current = idx;
  };

  const handleProjectDragOver = (e, idx, id) => {
    e.preventDefault();
    dragOverProjectIdx.current = idx;
    setDragOverId(id);
  };

  const handleProjectDragLeave = () => {
    setDragOverId(null);
  };

  const handleProjectDrop = async () => {
    setDragOverId(null);
    const from = dragProjectIdx.current;
    const to = dragOverProjectIdx.current;
    if (from === null || to === null || from === to) return;
    const newProjects = [...projects];
    const [moved] = newProjects.splice(from, 1);
    newProjects.splice(to, 0, moved);
    setProjects(newProjects);
    dragProjectIdx.current = null;
    dragOverProjectIdx.current = null;
    await Promise.all(newProjects.map((p, i) => updateItem('projects', p.id, { sort_order: i })));
  };

  const handleManageImages = async (project) => {
    setManagingImagesForProject(project);
    const data = await getProject(project.id);
    setProjectProcessImages(data?.process_images || []);
  };

  const handleAddProcessImage = async (e) => {
    e.preventDefault();
    if (!processImageFile) { alert('กรุณาเลือกรูปภาพ'); return; }
    try {
      const img_path = await fileToResizedDataURL(processImageFile);
      const next = [...projectProcessImages, { id: Date.now(), img_path, caption: processImageCaption }];
      await updateItem('projects', managingImagesForProject.id, { process_images: next });
      setProcessImageFile(null); setProcessImageCaption('');
      handleManageImages(managingImagesForProject);
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const handleDeleteProcessImage = async (imgId) => {
    if (!window.confirm('ลบรูปนี้?')) return;
    const next = projectProcessImages.filter(i => i.id !== imgId);
    await updateItem('projects', managingImagesForProject.id, { process_images: next });
    handleManageImages(managingImagesForProject);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('ต้องการลบโครงการนี้?')) return;
    try {
      await deleteItem('projects', id);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCalculatorType = async (e) => {
    e.preventDefault();
    if (!calcTypeName || !calcTypePrice) {
      alert('Please fill type name and price.');
      return;
    }

    try {
      const payload = {
        type_name: calcTypeName,
        base_price: parseFloat(calcTypePrice) || 0,
        sort_order: parseInt(calcTypeSortOrder) || 0,
      };
      if (calcTypeImage) payload.example_image_path = await fileToResizedDataURL(calcTypeImage);
      if (editingCalcTypeId) {
        await updateItem('calculator_types', editingCalcTypeId, payload);
      } else {
        await addItem('calculator_types', payload);
      }
      setCalcTypeName('');
      setCalcTypePrice('');
      setCalcTypeImage(null);
      setCalcTypeSortOrder('0');
      setEditingCalcTypeId(null);
      fetchCalculatorTypes();
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleEditCalculatorType = (type) => {
    setEditingCalcTypeId(type.id);
    setCalcTypeName(type.type_name);
    setCalcTypePrice(type.base_price);
    setCalcTypeSortOrder(type.sort_order);
    setCalcTypeImage(null);
  };

  const handleDeleteCalculatorType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calculator type?')) return;
    try {
      await deleteItem('calculator_types', id);
      fetchCalculatorTypes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingCalcTypeId(null);
    setCalcTypeName('');
    setCalcTypePrice('');
    setCalcTypeImage(null);
    setCalcTypeSortOrder('0');
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewRole || !reviewText) {
      alert('Please fill name, role, and text.');
      return;
    }

    const reviewData = {
      name: reviewName,
      role: reviewRole,
      text: reviewText,
      stars: parseInt(reviewStars),
      is_visible: reviewVisible ? 1 : 0
    };

    try {
      if (editingReviewId) {
        await updateItem('reviews', editingReviewId, reviewData);
      } else {
        await addItem('reviews', { ...reviewData, sort_order: reviews.length });
      }
      setReviewName('');
      setReviewRole('');
      setReviewText('');
      setReviewStars('5');
      setReviewVisible(true);
      setEditingReviewId(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setReviewName(review.name);
    setReviewRole(review.role);
    setReviewText(review.text);
    setReviewStars(review.stars);
    setReviewVisible(review.is_visible === 1);
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteItem('reviews', id);
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelReviewEdit = () => {
    setEditingReviewId(null);
    setReviewName('');
    setReviewRole('');
    setReviewText('');
    setReviewStars('5');
    setReviewVisible(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBusinessInfo = async (e) => {
    e.preventDefault();
    try {
      await setItem('business_info', 'main', businessInfo);
      alert('Business info saved successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleUpdateContent = async (id) => {
    if (!contentValue) {
      alert('Please enter content');
      return;
    }
    try {
      await setItem('content', id, { thai_content: contentValue });
      alert('Content updated successfully!');
      setEditingContentId(null);
      setContentValue('');
      fetchWebsiteContent();
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleEditContent = (content) => {
    setEditingContentId(content.id);
    setContentKey(content.section_key);
    setContentName(content.section_name);
    setContentValue(content.thai_content);
  };

  const handleCancelContentEdit = () => {
    setEditingContentId(null);
    setContentKey('');
    setContentName('');
    setContentValue('');
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceIcon || !serviceTitleThai || !serviceDescThai) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        icon: serviceIcon,
        title_thai: serviceTitleThai,
        description_thai: serviceDescThai,
        sort_order: parseInt(serviceSortOrder) || 0
      };
      if (editingServiceId) {
        await updateItem('services', editingServiceId, payload);
      } else {
        await addItem('services', payload);
      }
      alert(editingServiceId ? 'Service updated!' : 'Service created!');
      setServiceIcon('');
      setServiceTitleThai('');
      setServiceDescThai('');
      setServiceSortOrder('0');
      setEditingServiceId(null);
      fetchDatabaseServices();
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleEditService = (service) => {
    setEditingServiceId(service.id);
    setServiceIcon(service.icon);
    setServiceTitleThai(service.title_thai);
    setServiceDescThai(service.description_thai);
    setServiceSortOrder(service.sort_order);
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteItem('services', id);
      fetchDatabaseServices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelServiceEdit = () => {
    setEditingServiceId(null);
    setServiceIcon('');
    setServiceTitleThai('');
    setServiceDescThai('');
    setServiceSortOrder('0');
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const keys = ['projects_count', 'team_count', 'satisfaction_percent'];
      for (const key of keys) {
        if (websiteSettings[key]) {
          await setItem('settings', key, { setting_key: key, setting_value: websiteSettings[key] });
        }
      }
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  return (
    <div className="admin-dashboard container">
      <header className="admin-header">
        <div className="admin-brand">
          <span className="admin-brand-logo">BS</span>
          <div>
            <h1>Admin Dashboard</h1>
            <p className="admin-brand-sub">BS Build — ระบบจัดการเว็บไซต์</p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button onClick={() => navigate('/')} className="admin-btn admin-btn-ghost">
            ← กลับหน้าเว็บ
          </button>
          <button onClick={handleLogout} className="admin-btn admin-btn-danger">
            ออกจากระบบ
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {[
          { key: 'inbox', label: '📥 กล่องข้อความ' },
          { key: 'projects', label: '🏗️ ผลงาน' },
          { key: 'references', label: '🖼️ รูปอ้างอิง' },
          { key: 'reviews', label: '⭐ รีวิว' },
          { key: 'services', label: '🛠️ บริการ' },
          { key: 'calculator', label: '🧮 คำนวณราคา' },
          { key: 'content', label: '📝 เนื้อหา' },
          { key: 'hero', label: '🎬 Hero' },
          { key: 'business', label: '🏢 ข้อมูลธุรกิจ' },
          { key: 'settings', label: '⚙️ ตั้งค่า' },
        ].map(t => (
          <button
            key={t.key}
            className={`admin-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="admin-section" style={{ display: activeTab === 'business' ? 'block' : 'none' }}>
        <h2>Business Contact Information</h2>
        <form className="admin-form" onSubmit={handleSaveBusinessInfo}>
          <input
            type="text"
            placeholder="Company Name"
            value={businessInfo.company_name}
            onChange={e => setBusinessInfo({ ...businessInfo, company_name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Address"
            value={businessInfo.address}
            onChange={e => setBusinessInfo({ ...businessInfo, address: e.target.value })}
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={businessInfo.phone}
            onChange={e => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={businessInfo.email}
            onChange={e => setBusinessInfo({ ...businessInfo, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="LINE ID (เช่น @bsbuild — ปุ่ม LINE จะโผล่เมื่อมีค่า)"
            value={businessInfo.line_id}
            onChange={e => setBusinessInfo({ ...businessInfo, line_id: e.target.value })}
          />
          <input
            type="text"
            placeholder="Messenger URL (เช่น https://m.me/yourpage — ปุ่ม Messenger จะโผล่เมื่อมีค่า)"
            value={businessInfo.messenger_url}
            onChange={e => setBusinessInfo({ ...businessInfo, messenger_url: e.target.value })}
          />
          <button type="submit" className="btn btn-solid">Save Business Info</button>
        </form>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'projects' ? 'block' : 'none' }}>
        <h2>Manage Featured Projects</h2>

        {/* Manage Process Images Modal */}
        {managingImagesForProject && (
          <div style={{ background: '#f0f4ff', border: '2px solid #4a6fa5', borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📸 ภาพระหว่างดำเนินการ: {managingImagesForProject.title}</h3>
              <button onClick={() => setManagingImagesForProject(null)} style={{ background: '#ccc', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', cursor: 'pointer' }}>✕ ปิด</button>
            </div>

            <form onSubmit={handleAddProcessImage} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <input type="file" accept="image/*" onChange={e => setProcessImageFile(e.target.files[0])} required style={{ flex: 1 }} />
              <input type="text" placeholder="คำอธิบายรูป (optional)" value={processImageCaption} onChange={e => setProcessImageCaption(e.target.value)} style={{ flex: 2, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }} />
              <button type="submit" className="btn btn-solid" style={{ padding: '0.4rem 1rem' }}>+ เพิ่มรูป</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {projectProcessImages.length === 0 && <p style={{ color: '#888' }}>ยังไม่มีรูปภาพระหว่างดำเนินการ</p>}
              {projectProcessImages.map(img => (
                <div key={img.id} style={{ position: 'relative', textAlign: 'center' }}>
                  <img src={`${API}${img.img_path}`} alt={img.caption} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
                  {img.caption && <p style={{ fontSize: '0.75rem', margin: '0.25rem 0', color: '#555' }}>{img.caption}</p>}
                  <button onClick={() => handleDeleteProcessImage(img.id)} style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 4, padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>ลบ</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form className="admin-form" onSubmit={handleAddProject}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#444' }}>{editingProjectId ? '✏️ แก้ไขโครงการ' : '➕ เพิ่มโครงการใหม่'}</h3>
          <input
            type="text"
            placeholder="ชื่อโครงการ (เช่น ตกแต่งห้องนอนสมัยใหม่)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <select value={projectCategory} onChange={e => setProjectCategory(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}>
            <option value="interior">ตกแต่งภายใน (Interior)</option>
            <option value="exterior">ต่อเติมภายนอก (Exterior)</option>
            <option value="renovation">รีโนเวท (Renovation)</option>
          </select>
          <textarea
            placeholder="รายละเอียดโครงการ (เช่น วัสดุที่ใช้, ขั้นตอนการทำงาน, ระยะเวลา)"
            value={projectDescription}
            onChange={e => setProjectDescription(e.target.value)}
            rows={3}
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={e => setImageFile(e.target.files[0])}
            {...(!editingProjectId && { required: true })}
          />
          {editingProjectId && <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>* เลือกรูปใหม่เฉพาะเมื่อต้องการเปลี่ยน</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-solid">{editingProjectId ? 'บันทึกการแก้ไข' : 'เพิ่มโครงการ'}</button>
            {editingProjectId && <button type="button" onClick={handleCancelEditProject} style={{ background: '#ccc', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer' }}>ยกเลิก</button>}
          </div>
        </form>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 30 }}></th>
                <th>รูป</th>
                <th>ชื่อโครงการ</th>
                <th>หมวดหมู่</th>
                <th>รายละเอียด</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, idx) => (
                <tr
                  key={p.id}
                  draggable
                  onDragStart={() => handleProjectDragStart(idx)}
                  onDragOver={(e) => handleProjectDragOver(e, idx, p.id)}
                  onDragLeave={handleProjectDragLeave}
                  onDrop={handleProjectDrop}
                  className={dragOverId === p.id ? 'drag-over' : ''}
                  style={{
                    background: editingProjectId === p.id ? '#fffbeb' : '',
                    transition: 'background 0.15s'
                  }}
                >
                  <td style={{ textAlign: 'center', color: '#aaa', fontSize: '0.8rem' }}>{idx + 1}</td>
                  <td style={{ textAlign: 'center', fontSize: '1.1rem', color: '#bbb', userSelect: 'none' }} title="ลากเพื่อเรียงลำดับ">⠿</td>
                  <td><img src={`${p.img.startsWith('http') ? '' : API}${p.img}`} alt="thumb" className="admin-thumb" /></td>
                  <td>{p.title}</td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', background: p.category === 'interior' ? '#e8f5e9' : p.category === 'exterior' ? '#e3f2fd' : '#fce4ec', color: '#333' }}>
                      {p.category === 'interior' ? 'ภายใน' : p.category === 'exterior' ? 'ภายนอก' : 'รีโนเวท'}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#666' }}>
                    {p.description || '-'}
                  </td>
                  <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button onClick={() => handleEditProject(p)} style={{ background: '#4a6fa5', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>✏️ แก้ไข</button>
                    <button onClick={() => handleManageImages(p)} style={{ background: '#2d8a4e', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>📸 รูป</button>
                    <button onClick={() => handleDeleteProject(p.id)} className="btn-delete" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>🗑️ ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'calculator' ? 'block' : 'none' }}>
        <h2>Calculator Configuration</h2>

        <form className="admin-form" onSubmit={handleAddCalculatorType}>
          <input
            type="text"
            placeholder="Type Name (e.g. Interior (ห้องชั้นใน))"
            value={calcTypeName}
            onChange={e => setCalcTypeName(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Base Price (e.g. 5000)"
            value={calcTypePrice}
            onChange={e => setCalcTypePrice(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Sort Order"
            value={calcTypeSortOrder}
            onChange={e => setCalcTypeSortOrder(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={e => setCalcTypeImage(e.target.files[0])}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-solid">
              {editingCalcTypeId ? 'Update Type' : 'Add Type'}
            </button>
            {editingCalcTypeId && (
              <button type="button" onClick={handleCancelEdit} className="btn btn-outline">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type Name</th>
                <th>Base Price</th>
                <th>Image</th>
                <th>Sort Order</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {calculatorTypes.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.type_name}</td>
                  <td>฿{t.base_price.toLocaleString()}</td>
                  <td>
                    {t.example_image_path && (
                      <img src={t.example_image_path} alt="example" className="admin-thumb" />
                    )}
                  </td>
                  <td>{t.sort_order}</td>
                  <td>
                    <button onClick={() => handleEditCalculatorType(t)} className="btn-edit" style={{ marginRight: '0.5rem' }}>Edit</button>
                    <button onClick={() => handleDeleteCalculatorType(t.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Reference Images ─── */}
      <section className="admin-section" id="ref-form" style={{ display: activeTab === 'references' ? 'block' : 'none' }}>
        <h2>Manage Reference Images</h2>

        <form className="admin-form" onSubmit={handleAddReference}>
          <h3>{editingRefId ? 'แก้ไขรูป Reference' : 'เพิ่มรูป Reference ใหม่'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>ชื่อ / คำอธิบาย *</label>
              <input value={refTitle} onChange={e => setRefTitle(e.target.value)} placeholder="เช่น ห้องนั่งเล่นสไตล์โมเดิร์น" required />
            </div>
            <div>
              <label>หมวดหมู่</label>
              <input value={refCategory} onChange={e => setRefCategory(e.target.value)} placeholder="เช่น ห้องนั่งเล่น, ห้องนอน, ภายนอก" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
            <div>
              <label>รูปภาพ {editingRefId ? '(เว้นว่างถ้าไม่เปลี่ยน)' : '*'}</label>
              <input type="file" accept="image/*" onChange={e => setRefImage(e.target.files[0])} required={!editingRefId} />
            </div>
            <div>
              <label>ลำดับ (Sort Order)</label>
              <input type="number" value={refSortOrder} onChange={e => setRefSortOrder(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary">{editingRefId ? 'บันทึกการแก้ไข' : 'เพิ่มรูป'}</button>
            {editingRefId && <button type="button" className="btn-secondary" onClick={() => { setEditingRefId(null); setRefTitle(''); setRefCategory('ทั่วไป'); setRefSortOrder('0'); setRefImage(null); }}>ยกเลิก</button>}
          </div>
        </form>

        <table className="admin-table" style={{ marginTop: '1.5rem' }}>
          <thead>
            <tr>
              <th>รูป</th>
              <th>ชื่อ</th>
              <th>หมวด</th>
              <th>ลำดับ</th>
              <th>แสดง</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {references.map(ref => (
              <tr key={ref.id}>
                <td><img src={`${API}${ref.img_path}`} alt={ref.title} style={{ width: 70, height: 50, objectFit: 'cover', borderRadius: 4 }} /></td>
                <td>{ref.title}</td>
                <td>{ref.category}</td>
                <td>{ref.sort_order}</td>
                <td>
                  <input type="checkbox" checked={!!ref.is_visible} onChange={() => handleToggleRefVisible(ref)} />
                </td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditReference(ref)}>แก้ไข</button>
                  <button className="btn-delete" onClick={() => handleDeleteReference(ref.id)}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ─── Hero Background (Image or Video) ─── */}
      <section className="admin-section" style={{ display: activeTab === 'hero' ? 'block' : 'none' }}>
        <h2>🖼️ Hero Background (รูป / วิดีโอ)</h2>
        <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>
          พื้นหลังของส่วน Hero — รองรับทั้ง <strong>รูปภาพ</strong> และ <strong>วิดีโอเต็มเฟรม</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#fff8e1', borderLeft: '4px solid #f59e0b', borderRadius: 6, padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#5c4400' }}>
            <strong>📐 ถ้าใช้รูปภาพ:</strong><br/>
            • ขนาด: <strong>1920 × 1080 px</strong> (16:9)<br/>
            • น้ำหนัก: ≤ 500 KB (<a href="https://tinypng.com" target="_blank" rel="noreferrer" style={{ color: '#c9740a' }}>tinypng.com</a>)<br/>
            • Format: JPG / WebP<br/>
            • เนื้อหา: <strong>ไม่มีคน</strong>
          </div>
          <div style={{ background: '#e8f0ff', borderLeft: '4px solid #4a6fa5', borderRadius: 6, padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#1e3a5f' }}>
            <strong>🎬 ถ้าใช้วิดีโอ:</strong><br/>
            • ขนาด: <strong>1920×1080</strong> หรือ 1280×720<br/>
            • ความยาว: 8-15 วินาที (loop)<br/>
            • น้ำหนัก: ≤ 10 MB (แนะนำ ≤ 5 MB)<br/>
            • Format: <strong>MP4 (H.264)</strong> หรือ WebM<br/>
            • วิดีโอจะเล่นวน เงียบเสมอ — โหลดฟรีที่ <a href="https://www.pexels.com/videos/" target="_blank" rel="noreferrer" style={{ color: '#4a6fa5' }}>Pexels Videos</a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Current preview */}
          <div>
            <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.4rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>ปัจจุบัน:</span>
              <span style={{
                background: heroBgImage?.media_type === 'video' ? '#4a6fa5' : '#f59e0b',
                color: '#fff', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600
              }}>
                {heroBgImage?.media_type === 'video' ? '🎬 VIDEO' : '🖼️ IMAGE'}
              </span>
            </p>
            {heroBgImage?.image_path ? (
              heroBgImage.media_type === 'video' ? (
                <video
                  src={`${API}${heroBgImage.image_path}`}
                  autoPlay loop muted playsInline
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd', background: '#000' }}
                />
              ) : (
                <img
                  src={`${API}${heroBgImage.image_path}`}
                  alt="Hero Background"
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
                />
              )
            ) : (
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                ยังไม่มีไฟล์
              </div>
            )}
          </div>

          {/* Upload form */}
          <div>
            <label style={{ fontSize: '0.85rem', color: '#444', fontWeight: 600 }}>เลือกไฟล์ใหม่ (รูป หรือ วิดีโอ)</label>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={e => setHeroBgFile(e.target.files[0])}
              style={{ display: 'block', marginTop: '0.4rem', marginBottom: '0.75rem' }}
            />
            {heroBgFile && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '0.6rem 0.85rem', marginBottom: '0.85rem', fontSize: '0.85rem' }}>
                <span style={{
                  background: heroBgFile.type.startsWith('video/') ? '#4a6fa5' : '#f59e0b',
                  color: '#fff', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, marginRight: '0.5rem'
                }}>
                  {heroBgFile.type.startsWith('video/') ? '🎬 VIDEO' : '🖼️ IMAGE'}
                </span>
                <strong>{heroBgFile.name}</strong>
                <span style={{ color: '#666' }}> ({(heroBgFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                {heroBgFile.size > 10 * 1024 * 1024 && (
                  <p style={{ color: '#c00', margin: '0.3rem 0 0', fontSize: '0.78rem' }}>
                    ⚠️ ไฟล์ใหญ่กว่า 10 MB อาจโหลดช้า — แนะนำบีบอัดก่อน
                  </p>
                )}
              </div>
            )}
            <button
              onClick={handleUploadHeroBg}
              disabled={!heroBgFile || heroBgUploading}
              className="btn-primary"
              style={{ opacity: (!heroBgFile || heroBgUploading) ? 0.5 : 1 }}
            >
              {heroBgUploading ? '⏳ กำลังอัปโหลด...' : '💾 อัปเดตพื้นหลัง'}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Notification Settings (server-only; hidden on serverless host) ─── */}
      <section className="admin-section" style={{ display: 'none' }}>
        <h2>🔔 Notification Settings</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          ตั้งค่าช่องทางแจ้งเตือนเมื่อลูกค้ากรอกข้อมูล — เปิดใช้งานและกด <strong>ทดสอบ</strong> เพื่อตรวจสอบ
        </p>

        <div style={{ display: 'grid', gap: '1.5rem' }}>

          {/* EMAIL */}
          <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: notifSettings.email?.enabled ? '#f0fff4' : '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📧</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Email (Gmail)</h3>
              <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!notifSettings.email?.enabled}
                  onChange={e => setNotifSettings(prev => ({ ...prev, email: { ...prev.email, enabled: e.target.checked } }))} />
                <span style={{ fontSize: '0.85rem' }}>เปิดใช้งาน</span>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Gmail Account (ผู้ส่ง)</label>
                <input value={notifSettings.email?.config?.email_user || ''} onChange={e => updateNotifConfig('email', 'email_user', e.target.value)} placeholder="yourname@gmail.com" /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>App Password <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#4a6fa5', fontSize: '0.75rem' }}>วิธีรับ?</a></label>
                <input type="password" value={notifSettings.email?.config?.email_password || ''} onChange={e => updateNotifConfig('email', 'email_password', e.target.value)} placeholder="xxxx xxxx xxxx xxxx" /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: '0.8rem', color: '#555' }}>ส่งแจ้งเตือนไปที่ Email (ปล่อยว่าง = ใช้ Gmail Account ด้านบน)</label>
                <input value={notifSettings.email?.config?.notify_to || ''} onChange={e => updateNotifConfig('email', 'notify_to', e.target.value)} placeholder="admin@yourdomain.com" /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => handleSaveNotif('email')}>💾 บันทึก</button>
              <button className="btn-secondary" onClick={() => handleTestNotif('email')} disabled={notifTesting.email}>
                {notifTesting.email ? '⏳ กำลังส่ง...' : '📤 ทดสอบ'}
              </button>
              {notifTestResult.email && (
                <span style={{ fontSize: '0.85rem', color: notifTestResult.email.ok ? 'green' : 'red' }}>
                  {notifTestResult.email.ok ? '✅ ส่งสำเร็จ!' : `❌ ${notifTestResult.email.error}`}
                </span>
              )}
            </div>
          </div>

          {/* LINE */}
          <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: notifSettings.line?.enabled ? '#f0fff4' : '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>💬</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>LINE Official Account</h3>
              <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!notifSettings.line?.enabled}
                  onChange={e => setNotifSettings(prev => ({ ...prev, line: { ...prev.line, enabled: e.target.checked } }))} />
                <span style={{ fontSize: '0.85rem' }}>เปิดใช้งาน</span>
              </label>
            </div>
            <div style={{ background: '#e8f4fd', borderRadius: 6, padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: '#444', marginBottom: '0.85rem' }}>
              📌 <strong>วิธีรับค่า:</strong> ไปที่ <a href="https://developers.line.biz/console/" target="_blank" rel="noreferrer" style={{ color: '#06c755' }}>LINE Developers Console</a> → เลือก Channel → Messaging API → Channel Access Token (Long-lived) | Admin User ID: ส่งข้อความหา Bot แล้วดูใน webhook log
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Channel Access Token</label>
                <input type="password" value={notifSettings.line?.config?.channel_access_token || ''} onChange={e => updateNotifConfig('line', 'channel_access_token', e.target.value)} placeholder="Long-lived token..." /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Admin User ID (LINE)</label>
                <input value={notifSettings.line?.config?.admin_user_id || ''} onChange={e => updateNotifConfig('line', 'admin_user_id', e.target.value)} placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => handleSaveNotif('line')}>💾 บันทึก</button>
              <button className="btn-secondary" onClick={() => handleTestNotif('line')} disabled={notifTesting.line}>
                {notifTesting.line ? '⏳ กำลังส่ง...' : '📤 ทดสอบ'}
              </button>
              {notifTestResult.line && (
                <span style={{ fontSize: '0.85rem', color: notifTestResult.line.ok ? 'green' : 'red' }}>
                  {notifTestResult.line.ok ? '✅ ส่งสำเร็จ!' : `❌ ${notifTestResult.line.error}`}
                </span>
              )}
            </div>
          </div>

          {/* FACEBOOK */}
          <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: notifSettings.facebook?.enabled ? '#f0fff4' : '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📘</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Facebook Messenger</h3>
              <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!notifSettings.facebook?.enabled}
                  onChange={e => setNotifSettings(prev => ({ ...prev, facebook: { ...prev.facebook, enabled: e.target.checked } }))} />
                <span style={{ fontSize: '0.85rem' }}>เปิดใช้งาน</span>
              </label>
            </div>
            <div style={{ background: '#e8f0fe', borderRadius: 6, padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: '#444', marginBottom: '0.85rem' }}>
              📌 <strong>วิธีรับค่า:</strong> ไปที่ <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" style={{ color: '#1877f2' }}>Facebook Developers</a> → สร้าง App → Messenger → Page Access Token | Admin PSID: ส่งข้อความหา Page แล้วดู PSID จาก webhook
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Page Access Token</label>
                <input type="password" value={notifSettings.facebook?.config?.page_access_token || ''} onChange={e => updateNotifConfig('facebook', 'page_access_token', e.target.value)} placeholder="EAAxxxxxxx..." /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Admin PSID (Messenger ID)</label>
                <input value={notifSettings.facebook?.config?.admin_psid || ''} onChange={e => updateNotifConfig('facebook', 'admin_psid', e.target.value)} placeholder="1234567890..." /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => handleSaveNotif('facebook')}>💾 บันทึก</button>
              <button className="btn-secondary" onClick={() => handleTestNotif('facebook')} disabled={notifTesting.facebook}>
                {notifTesting.facebook ? '⏳ กำลังส่ง...' : '📤 ทดสอบ'}
              </button>
              {notifTestResult.facebook && (
                <span style={{ fontSize: '0.85rem', color: notifTestResult.facebook.ok ? 'green' : 'red' }}>
                  {notifTestResult.facebook.ok ? '✅ ส่งสำเร็จ!' : `❌ ${notifTestResult.facebook.error}`}
                </span>
              )}
            </div>
          </div>

        </div>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'reviews' ? 'block' : 'none' }}>
        <h2>Manage Client Reviews</h2>

        <form className="admin-form" onSubmit={handleAddReview}>
          <input
            type="text"
            placeholder="Customer Name"
            value={reviewName}
            onChange={e => setReviewName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Role/Title (e.g. Home Owner)"
            value={reviewRole}
            onChange={e => setReviewRole(e.target.value)}
            required
          />
          <textarea
            placeholder="Review Text"
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            required
            rows="4"
            style={{ fontFamily: 'inherit', padding: '0.5rem' }}
          />
          <select
            value={reviewStars}
            onChange={e => setReviewStars(e.target.value)}
            style={{ padding: '0.75rem' }}
          >
            <option value="1">1 Star</option>
            <option value="2">2 Stars</option>
            <option value="3">3 Stars</option>
            <option value="4">4 Stars</option>
            <option value="5">5 Stars</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <input
              type="checkbox"
              checked={reviewVisible}
              onChange={e => setReviewVisible(e.target.checked)}
            />
            Visible on website
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-solid">
              {editingReviewId ? 'Update Review' : 'Add Review'}
            </button>
            {editingReviewId && (
              <button type="button" onClick={handleCancelReviewEdit} className="btn btn-outline">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Text</th>
                <th>Stars</th>
                <th>Visible</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.role}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.text}</td>
                  <td>{'★'.repeat(r.stars)}</td>
                  <td>{r.is_visible === 1 ? '✓' : '✗'}</td>
                  <td>
                    <button onClick={() => handleEditReview(r)} className="btn-edit" style={{ marginRight: '0.5rem' }}>Edit</button>
                    <button onClick={() => handleDeleteReview(r.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'inbox' ? 'block' : 'none' }}>
        <h2>Customer Inquiries (Inbox)</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Contact (Line/Phone)</th>
                <th>Email</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id}>
                  <td>{new Date(c.created_at).toLocaleString()}</td>
                  <td>{c.name}</td>
                  <td>{c.contact_info}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.message || '-'}</td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign:'center' }}>No inquiries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'content' ? 'block' : 'none' }}>
        <h2>Manage Website Content (Thai Text)</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Key</th>
                <th>Content</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {websiteContent.map(content => (
                <tr key={content.id}>
                  <td>{content.section_name}</td>
                  <td>{content.section_key}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{content.thai_content}</td>
                  <td>
                    <button onClick={() => handleEditContent(content)} className="btn-edit">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingContentId && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Editing: {contentName}</h3>
            <textarea
              style={{ width: '100%', padding: '1rem', minHeight: '150px', fontFamily: 'inherit' }}
              value={contentValue}
              onChange={e => setContentValue(e.target.value)}
              placeholder="Enter Thai content..."
            />
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <button onClick={() => handleUpdateContent(editingContentId)} className="btn btn-solid">Save Content</button>
              <button onClick={handleCancelContentEdit} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        )}
      </section>

      <section className="admin-section" style={{ display: activeTab === 'services' ? 'block' : 'none' }}>
        <h2>Manage Services</h2>

        <form className="admin-form" onSubmit={handleSaveService}>
          <input
            type="text"
            placeholder="Icon (e.g., 🎨)"
            value={serviceIcon}
            onChange={e => setServiceIcon(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Title (Thai)"
            value={serviceTitleThai}
            onChange={e => setServiceTitleThai(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (Thai)"
            value={serviceDescThai}
            onChange={e => setServiceDescThai(e.target.value)}
            required
            rows="3"
            style={{ fontFamily: 'inherit', padding: '0.5rem' }}
          />
          <input
            type="number"
            placeholder="Sort Order"
            value={serviceSortOrder}
            onChange={e => setServiceSortOrder(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-solid">
              {editingServiceId ? 'Update Service' : 'Add Service'}
            </button>
            {editingServiceId && (
              <button type="button" onClick={handleCancelServiceEdit} className="btn btn-outline">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Title (Thai)</th>
                <th>Description</th>
                <th>Sort Order</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dbServices.map(s => (
                <tr key={s.id}>
                  <td style={{ fontSize: '1.5rem' }}>{s.icon}</td>
                  <td>{s.title_thai}</td>
                  <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.description_thai}</td>
                  <td>{s.sort_order}</td>
                  <td>
                    <button onClick={() => handleEditService(s)} className="btn-edit" style={{ marginRight: '0.5rem' }}>Edit</button>
                    <button onClick={() => handleDeleteService(s.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
        <h2>Website Settings</h2>
        <form className="admin-form" onSubmit={handleSaveSettings}>
          <div className="form-group">
            <label>Total Projects (e.g., 500+)</label>
            <input
              type="text"
              value={websiteSettings.projects_count || ''}
              onChange={e => setWebsiteSettings({ ...websiteSettings, projects_count: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Team Members (e.g., 30+)</label>
            <input
              type="text"
              value={websiteSettings.team_count || ''}
              onChange={e => setWebsiteSettings({ ...websiteSettings, team_count: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Customer Satisfaction (e.g., 95%)</label>
            <input
              type="text"
              value={websiteSettings.satisfaction_percent || ''}
              onChange={e => setWebsiteSettings({ ...websiteSettings, satisfaction_percent: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-solid">Save Settings</button>
        </form>
      </section>
    </div>
  );
};

export default Admin;


