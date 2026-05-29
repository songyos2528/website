import React, { useState, useEffect } from 'react';
import { getCalculatorTypes, getBusinessInfo, submitContact } from '../firebase/api';
import './Footer.css';

const Footer = () => {
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
    email: '',
    message: '',
    serviceType: ''
  });
  const [status, setStatus] = useState('');
  const [calculatorTypes, setCalculatorTypes] = useState([]);
  const [businessInfo, setBusinessInfo] = useState({
    company_name: 'BS Build',
    phone: '02-322-0000',
    line_id: '@bsbuild',
    address: 'กรุงเทพมหานคร'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [types, info] = await Promise.all([
          getCalculatorTypes(),
          getBusinessInfo()
        ]);

        setCalculatorTypes(types);
        if (types.length > 0 && !formData.serviceType) {
          setFormData(prev => ({ ...prev, serviceType: types[0].type_name }));
        }

        if (info) {
          setBusinessInfo({
            company_name: info.company_name || 'BS Build',
            phone: info.phone || '02-322-0000',
            line_id: info.line_id || '',
            address: info.address || 'กรุงเทพมหานคร'
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.contactInfo || !formData.email || !formData.serviceType) {
      setStatus('⚠️ โปรดกรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setStatus('⏳ กำลังส่ง...');

    // Apps Script URL handles the email notification (still free, serverless).
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL ||
      'https://script.google.com/macros/s/AKfycbzovEiAdV-eG79hKvMAtXTZZGClcwn__bzHuXmAKyndf8Jx0rAaqhfTPPCUSRu6EtY/exec';

    try {
      // 1) Save to Firestore so it shows up in the admin inbox
      await submitContact(formData);
    } catch (err) {
      console.error('Firestore submit error:', err);
    }

    // 2) Fire-and-forget the Apps Script email notification
    if (APPS_SCRIPT_URL) {
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          contactInfo: formData.contactInfo,
          email: formData.email,
          serviceType: formData.serviceType,
          message: formData.message
        })
      }).catch(err => console.error('Apps Script notify error:', err));
    }

    setStatus('✅ ส่งคำขอประมาณการเรียบร้อย! เราจะติดต่อคุณเร็วที่สุด');
    setFormData({
      name: '',
      contactInfo: '',
      email: '',
      message: '',
      serviceType: calculatorTypes.length > 0 ? calculatorTypes[0].type_name : ''
    });
  };

  return (
    <footer className="footer" id="contact">
      <div className="container footer-container">
        <div className="footer-left">
          <h2 className="footer-title">Let's Create<br />Something Exceptional.</h2>
          <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>ระบบขอใบเสนอราคาออนไลน์ กรอกข้อมูลเพื่อให้เราติดต่อกลับพร้อมประเมินราคาให้ฟรี!</p>
          <div className="footer-contact-info">
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <p>Phone: {businessInfo.phone}</p>
            </div>
            {businessInfo.line_id && (
            <div className="contact-item">
              <span className="contact-icon">📱</span>
              <p>Line: {businessInfo.line_id}</p>
            </div>
            )}
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <p>Location: {businessInfo.address}</p>
            </div>
          </div>
        </div>
        
        <div className="footer-right">
          <form className="contact-form" onSubmit={handleSubmit} style={{background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h3 style={{marginBottom: '1.5rem', color: 'var(--color-accent)'}}>ขอใบเสนอราคา (Quotation)</h3>
            <div className="form-group">
              <input type="text" name="name" placeholder="ชื่อ-นามสกุล *" value={formData.name} onChange={handleChange} required style={{background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', padding: '0.75rem', width: '100%'}} />
              <input type="text" name="contactInfo" placeholder="Line ID / เบอร์โทร *" value={formData.contactInfo} onChange={handleChange} required style={{background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', padding: '0.75rem', width: '100%'}} />
            </div>
            <div className="form-group" style={{marginTop: '1rem'}}>
              <select name="serviceType" value={formData.serviceType} onChange={handleChange} style={{padding: '0.75rem', background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', width: '100%'}}>
                <option value="">ประเภทงาน</option>
                {calculatorTypes.map(type => (
                  <option key={type.id} value={type.type_name}>{type.type_name}</option>
                ))}
              </select>
            </div>
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={{marginTop: '1rem', background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', padding: '0.75rem', width: '100%'}} />
            <textarea name="message" placeholder="รายละเอียดงานที่ต้องการ..." rows="3" value={formData.message} onChange={handleChange} style={{marginTop: '1rem', background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', padding: '0.75rem', width: '100%'}}></textarea>
            <button type="submit" className="btn btn-solid submit-btn" style={{width: '100%'}}>REQUEST QUOTATION</button>
            {status && <p style={{ marginTop: '1rem', color: status.includes('✅') ? '#4caf50' : '#f44336', textAlign: 'center' }}>{status}</p>}
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <div className="logo-text" style={{ fontSize: '1.5rem' }}>{businessInfo.company_name}</div>
          <p className="copyright">&copy; 2026 {businessInfo.company_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

