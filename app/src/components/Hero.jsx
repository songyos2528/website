import React, { useState, useEffect } from 'react';
import { getImages, getContentByKey } from '../firebase/api';
import { useParallax } from '../lib/motion';
import './Hero.css';

const Hero = () => {
  const [content, setContent] = useState({
    title: 'EXCEPTIONAL CRAFTSMANSHIP',
    description: 'ทีมงานมืออาชีพ | ประสบการณ์ 30+ ปี',
  });
  const [heroImg, setHeroImg] = useState('/website/hero.jpg');
  const [mediaType, setMediaType] = useState('image');
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const parallaxRef = useParallax(0.12);

  useEffect(() => {
    getImages('hero')
      .then(data => {
        const bg = Array.isArray(data) ? data.find(i => i.image_key === 'hero_background') : null;
        if (bg?.image_path) { setHeroImg(bg.image_path); setMediaType(bg.media_type || 'image'); }
      })
      .catch(() => {});
    (async () => {
      try {
        const [t, d] = await Promise.all([
          getContentByKey('hero_title'),
          getContentByKey('hero_description'),
        ]);
        setContent(c => ({
          title: t.thai_content || c.title,
          description: d.thai_content || c.description,
        }));
      } catch { /* keep defaults */ }
    })();
  }, []);

  const src = (heroImg.startsWith('http') || heroImg.startsWith('/website'))
    ? heroImg : apiUrl + heroImg;

  return (
    <section className="hero" id="home">
      <div className="container hero-grid">
        <div className="hero-text" data-aos="fade-up">
          <p className="hero-eyebrow">BS BUILD · PROFESSIONAL CONSTRUCTION</p>
          <h1 className="hero-title">{content.title}</h1>
          <p className="hero-description">{content.description}</p>
          <div className="hero-actions">
            <a href="#contact" className="btn btn-solid">ปรึกษาสถาปนิกฟรี</a>
            <a href="#projects" className="hero-link">ดูผลงาน →</a>
          </div>
        </div>

        <div className="hero-media" data-aos="fade-left" data-aos-delay="150">
          <div className="hero-media-frame">
            {mediaType === 'video' ? (
              <video ref={parallaxRef} className="hero-img" src={src} autoPlay loop muted playsInline />
            ) : (
              <img ref={parallaxRef} className="hero-img" src={src} alt="งานตกแต่งและต่อเติมระดับพรีเมียม" />
            )}
          </div>
          <span className="hero-badge"><strong>30+</strong> ปีประสบการณ์</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
