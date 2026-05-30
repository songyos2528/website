import React, { useState, useEffect, useRef } from 'react';
import { getImages } from '../firebase/api';
import './BeforeAfter.css';

const BeforeAfter = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const [images, setImages] = useState({
    after: '/website/after_living_room.png',
    before: '/website/before_living_room.png'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBeforeAfterImages = async () => {
      try {
        const data = await getImages('before_after');

        // Organize images by key: before_after_after and before_after_before
        const imageMap = {};
        data.forEach(img => {
          imageMap[img.image_key] = img;
        });

        setImages({
          after: imageMap['before_after_after']?.image_path || '/website/after_living_room.png',
          before: imageMap['before_after_before']?.image_path || '/website/before_living_room.png'
        });
      } catch (err) {
        console.error('Error fetching before/after images:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBeforeAfterImages();
  }, []);

  const handleSliderChange = (e) => {
    setSliderPos(e.target.value);
  };

  const setPosFromX = (clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let p = ((clientX - r.left) / r.width) * 100;
    setSliderPos(Math.max(2, Math.min(98, p)));
  };
  const onPointerDown = (e) => {
    draggingRef.current = true;
    containerRef.current?.setPointerCapture?.(e.pointerId);
    setPosFromX(e.clientX);
  };
  const onPointerMove = (e) => { if (draggingRef.current) setPosFromX(e.clientX); };
  const stopDrag = () => { draggingRef.current = false; };

  if (loading) {
    return (
      <section className="before-after section" id="portfolio">
        <div className="container" data-aos="fade-up">
          <h2 className="section-title text-center">BEFORE & AFTER</h2>
          <p className="text-center text-muted mb-3">Slide to see the transformation.</p>
          <div className="slider-container" style={{ height: '400px', background: '#e0e0e0', borderRadius: '8px' }}></div>
        </div>
      </section>
    );
  }

  return (
    <section className="before-after section" id="portfolio">
      <div className="container" data-aos="fade-up">
        <h2 className="section-title text-center">BEFORE & AFTER</h2>
        <p className="text-center text-muted mb-3">Slide to see the transformation.</p>
        <div
          className="slider-container"
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
        >
          <div className="image-after">
            <img src={images.after} alt="After Renovation" loading="lazy" decoding="async" />
            <span className="ba-tag ba-tag--after">After</span>
          </div>
          <div className="image-before" style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}>
            <img src={images.before} alt="Before Renovation" loading="lazy" decoding="async" />
            <span className="ba-tag ba-tag--before">Before</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={handleSliderChange}
            className="slider-input"
            aria-label="เลื่อนเปรียบเทียบก่อน-หลัง"
          />
          <div className="slider-line" style={{ left: `${sliderPos}%` }}>
            <div className="slider-button">↔</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;

