import React, { useState, useEffect } from 'react';
import { getContentByKey, getSettings } from '../firebase/api';
import { useCountUp } from '../lib/motion';
import './AboutUs.css';

const AboutUs = () => {
  const [aboutContent, setAboutContent] = useState({
    description: 'เราคือทีมผู้รับเหมาที่มีประสบการณ์ยาวนานกว่า 30 ปี มุ่งมั่นสร้างสรรค์ผลงานคุณภาพด้วยมาตรฐานสูงสุด พร้อมทีมงานผู้เชี่ยวชาญทั้งด้านวิศวกรรม สถาปัตยกรรม และการออกแบบภายใน เพื่อส่งมอบบ้านและพื้นที่ที่สมบูรณ์แบบที่สุดให้กับคุณ'
  });
  const [stats, setStats] = useState({
    projects: '500',
    team: '30',
    satisfaction: '95'
  });
  const projectsRef = useCountUp(stats.projects, { suffix: '+' });
  const teamRef = useCountUp(stats.team, { suffix: '+' });
  const satisfactionRef = useCountUp(stats.satisfaction, { suffix: '%' });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [descData, settingsData] = await Promise.all([
          getContentByKey('about_description'),
          getSettings()
        ]);

        if (descData.thai_content) {
          setAboutContent({ description: descData.thai_content });
        }

        const settingsObj = {};
        settingsData.forEach(s => {
          settingsObj[s.setting_key] = s.setting_value;
        });

        setStats({
          projects: settingsObj.projects_count || '500',
          team: settingsObj.team_count || '30',
          satisfaction: settingsObj.satisfaction_percent || '95'
        });
      } catch (err) {
        console.error('Error fetching about content:', err);
      }
    };
    fetchContent();
  }, []);

  return (
    <section className="about section" id="about">
      <div className="container about-container">
        <div className="about-content">
          <h2 className="section-title text-left">ABOUT US</h2>
          <p className="about-text">
            {aboutContent.description}
          </p>
          <div className="about-stats">
            <div className="stat-item">
              <h3 className="stat-number" ref={projectsRef}>{stats.projects}+</h3>
              <p className="stat-label">Projects</p>
            </div>
            <div className="stat-item">
              <h3 className="stat-number" ref={teamRef}>{stats.team}+</h3>
              <p className="stat-label">Structural Experts</p>
            </div>
            <div className="stat-item">
              <h3 className="stat-number" ref={satisfactionRef}>{stats.satisfaction}%</h3>
              <p className="stat-label">Happy Clients</p>
            </div>
          </div>
        </div>
        <div className="about-image-wrapper">
          <img src="/website/project_1.png" alt="Professional team at construction site" className="about-image" />
          <div className="about-image-accent"></div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;

