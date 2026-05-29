import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { getImages, getContentByKey } from '../firebase/api';
import { useParallax } from '../lib/motion';
import './Hero.css';

const Hero = () => {
  const [heroContent, setHeroContent] = useState({
    title: 'EXCEPTIONAL CRAFTSMANSHIP',
    subtitle: 'Cormorant Garamond',
    description: 'ทีมงาน | ประสบการณ์ 30+ ปี'
  });
  const [heroBg, setHeroBg] = useState('/hero_bg.png');
  const [heroMediaType, setHeroMediaType] = useState('image');
  const parallaxRef = useParallax(0.18);
  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    // Fetch hero background (image or video)
    getImages('hero')
      .then(data => {
        const bg = Array.isArray(data) ? data.find(i => i.image_key === 'hero_background') : null;
        if (bg?.image_path) {
          setHeroBg(bg.image_path);
          setHeroMediaType(bg.media_type || 'image');
        }
      })
      .catch(err => console.error('Error fetching hero background:', err));

    const fetchHeroContent = async () => {
      try {
        const [titleData, subtitleData, descData] = await Promise.all([
          getContentByKey('hero_title'),
          getContentByKey('hero_subtitle'),
          getContentByKey('hero_description')
        ]);

        setHeroContent({
          title: titleData.thai_content || heroContent.title,
          subtitle: subtitleData.thai_content || heroContent.subtitle,
          description: descData.thai_content || heroContent.description
        });
      } catch (err) {
        console.error('Error fetching hero content:', err);
      }
    };
    fetchHeroContent();
  }, []);

  return (
    <section className="hero" id="home">
      {heroMediaType === 'video' ? (
        <video
          key={heroBg}
          ref={parallaxRef}
          className="hero-bg-media"
          src={heroBg.startsWith('http') ? heroBg : apiUrl + heroBg}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : (
        <div
          key={heroBg}
          ref={parallaxRef}
          className="hero-bg-media hero-bg-image"
          style={{ backgroundImage: `url(${heroBg.startsWith('http') ? heroBg : apiUrl + heroBg})` }}
          aria-hidden="true"
        />
      )}
      <div className="hero-overlay"></div>
      <div className="container hero-content" data-aos="fade-up">
        <p className="hero-eyebrow" data-aos="fade-down">BS BUILD · PROFESSIONAL CONSTRUCTION</p>
        <h2 className="hero-subtitle" data-aos="fade-down" data-aos-delay="150">
          <TypeAnimation
            sequence={[
              heroContent.subtitle,
              3000,
              'LUXURY & PREMIUM DESIGN',
              3000,
              'EXCELLENCE IN EVERY DETAIL',
              3000,
            ]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
          />
        </h2>
        <h1 className="hero-title" data-aos="fade-up" data-aos-delay="250">{heroContent.title}</h1>
        <p className="hero-description" data-aos="fade-up" data-aos-delay="350">{heroContent.description}</p>
        <div className="hero-actions" data-aos="fade-up" data-aos-delay="450">
          <a href="#projects" className="btn btn-outline">ดูผลงาน</a>
          <a href="#contact" className="btn btn-solid">ขอใบเสนอราคา</a>
        </div>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true"></div>
    </section>
  );
};

export default Hero;

