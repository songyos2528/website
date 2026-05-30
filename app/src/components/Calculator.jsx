import React, { useState, useEffect, useMemo } from 'react';
import { getCalculatorTypes } from '../firebase/api';
import './Calculator.css';

const MIN_AREA = 10;
const MAX_AREA = 300;

const Calculator = () => {
  const [calculatorTypes, setCalculatorTypes] = useState([]);
  const [projectTypeId, setProjectTypeId] = useState(null);
  const [area, setArea] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await getCalculatorTypes();
        setCalculatorTypes(data);
        if (data.length > 0) setProjectTypeId(data[0].id);
      } catch (err) {
        console.error('Error fetching calculator types:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  // Live estimate — recomputes instantly when type or area changes (no button)
  const estimate = useMemo(() => {
    const selected = calculatorTypes.find(t => t.id === projectTypeId);
    if (!selected || !area) return null;
    const base = Number(selected.base_price) || 0;
    return {
      min: Math.floor(base * area * 0.9),
      max: Math.floor(base * area * 1.2),
    };
  }, [calculatorTypes, projectTypeId, area]);

  const fmt = (n) => n.toLocaleString('th-TH');
  const pct = ((area - MIN_AREA) / (MAX_AREA - MIN_AREA)) * 100;

  if (loading) {
    return (
      <section className="calculator section" id="calculator">
        <div className="container">
          <div className="calc-wrapper">
            <div className="calc-info">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
            </div>
            <div className="calculator-form">
              <div className="skeleton skeleton-input"></div>
              <div className="skeleton skeleton-input"></div>
              <div className="skeleton skeleton-btn"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="calculator section" id="calculator">
      <div className="container" data-aos="fade-up">
        <div className="calc-wrapper">
          <div className="calc-info">
            <p className="eyebrow">Budget Estimator</p>
            <h2 className="section-title text-left">ประเมินงบเบื้องต้น</h2>
            <p className="text-muted">เลือกประเภทงานและเลื่อนปรับขนาดพื้นที่ ระบบจะคำนวณช่วงงบประมาณให้ทันที — ไม่ต้องกรอกฟอร์ม ไม่ต้องรอ</p>
            <ul className="text-muted">
              <li>✓ คำนวณสดแบบ Real-time</li>
              <li>✓ อ้างอิงฐานข้อมูลวัสดุปี 2026</li>
            </ul>
          </div>

          <div className="calc-interactive-container">
            <div className="calculator-form">
              {/* Type chips */}
              <div className="calc-form-group">
                <label>ประเภทงานที่ต้องการ</label>
                <div className="calc-chips" role="radiogroup" aria-label="ประเภทงาน">
                  {calculatorTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      role="radio"
                      aria-checked={projectTypeId === type.id}
                      className={`calc-chip ${projectTypeId === type.id ? 'active' : ''}`}
                      onClick={() => setProjectTypeId(type.id)}
                    >
                      {type.type_name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area slider */}
              <div className="calc-form-group">
                <label>
                  ขนาดพื้นที่
                  <span className="calc-area-value">{area} <small>ตร.ม.</small></span>
                </label>
                <input
                  type="range"
                  className="calc-slider"
                  min={MIN_AREA}
                  max={MAX_AREA}
                  step="5"
                  value={area}
                  onChange={e => setArea(Number(e.target.value))}
                  style={{ '--pct': `${pct}%` }}
                  aria-label="ขนาดพื้นที่ (ตารางเมตร)"
                />
                <div className="calc-slider-scale">
                  <span>{MIN_AREA}</span>
                  <span>{MAX_AREA}+ ตร.ม.</span>
                </div>
              </div>
            </div>

            {estimate && (
              <div className="calculator-result" key={`${projectTypeId}-${area}`}>
                <h3>ช่วงงบประมาณโดยประมาณ (บาท)</h3>
                <div className="price-range">
                  <span className="price-min">{fmt(estimate.min)}</span>
                  <span className="price-sep">–</span>
                  <span className="price-max">{fmt(estimate.max)}</span>
                </div>
                <p className="disclaimer">*ราคาประเมินเบื้องต้น อาจเปลี่ยนแปลงตามหน้างานจริง</p>
                <a href="#contact" className="btn btn-solid calc-cta">ปรึกษาสถาปนิกฟรี →</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Calculator;
