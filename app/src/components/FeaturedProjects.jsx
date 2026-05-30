import React, { useState, useEffect } from 'react';
import { getProjects, getProject } from '../firebase/api';
import { useHorizontalPin } from '../lib/motion';
import './FeaturedProjects.css';

const CATEGORY_LABELS = {
  interior: 'ตกแต่งภายใน',
  exterior: 'ต่อเติมภายนอก',
  renovation: 'รีโนเวท'
};

const FeaturedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    getProjects()
      .then(data => { setProjects(data); setLoading(false); })
      .catch(err => { console.error('Failed to fetch projects:', err); setLoading(false); });
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedProject]);

  const filteredProjects = (projects || []).filter(p => filter === 'all' || (p.category || 'renovation') === filter);

  // Pinned horizontal scroll on desktop (recomputes when the filtered set changes)
  const { sectionRef, trackRef } = useHorizontalPin([filteredProjects.length, loading]);

  const handleOpenDetail = async (project) => {
    setSelectedProject(project);
    setDetailLoading(true);
    try {
      const data = await getProject(project.id);
      setProjectDetail(data || project);
    } catch (err) {
      console.error('Error loading project details:', err);
      setProjectDetail(project);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
    setProjectDetail(null);
  };

  const getImgSrc = (img) =>
    img && img.startsWith('http') ? img : `${apiUrl}${img}`;

  return (
    <section className="featured-projects" id="projects" ref={sectionRef}>
      <div className="fp-sticky">
        <div className="container fp-head">
          <div>
            <p className="eyebrow">Selected Works</p>
            <h2 className="section-title">ผลงานที่ผ่านมา</h2>
          </div>
          <div className="project-filters">
            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>ทั้งหมด</button>
            <button className={`filter-btn ${filter === 'interior' ? 'active' : ''}`} onClick={() => setFilter('interior')}>ตกแต่งภายใน</button>
            <button className={`filter-btn ${filter === 'exterior' ? 'active' : ''}`} onClick={() => setFilter('exterior')}>ต่อเติมภายนอก</button>
            <button className={`filter-btn ${filter === 'renovation' ? 'active' : ''}`} onClick={() => setFilter('renovation')}>รีโนเวท</button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading projects...</p>
        ) : (
          <div className="fp-track" ref={trackRef}>
            {filteredProjects.map((project, i) => (
              <article className="project-card fp-card" key={project.id} onClick={() => handleOpenDetail(project)}>
                <div className="project-img-wrapper">
                  <img src={getImgSrc(project.img)} alt={project.title} className="project-img" decoding="async" />
                  <span className="fp-index">{String(i + 1).padStart(2, '0')}</span>
                  <div className="project-overlay">
                    <span className="project-btn">ดูรายละเอียด</span>
                  </div>
                </div>
                <div className="project-info">
                  <span className="project-cat">{CATEGORY_LABELS[project.category] || 'รีโนเวท'}</span>
                  <h3 className="project-title">{project.title}</h3>
                </div>
              </article>
            ))}
            <div className="fp-end">
              <p className="eyebrow">Let's build</p>
              <a href="#contact" className="btn btn-solid">ปรึกษาสถาปนิกฟรี</a>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProject && (
        <div className="project-modal-overlay" onClick={handleCloseModal}>
          <div className="project-modal" onClick={e => e.stopPropagation()}>
            <button className="project-modal-close" onClick={handleCloseModal}>✕</button>

            <div className="project-modal-hero">
              <img src={getImgSrc(selectedProject.img)} alt={selectedProject.title} />
              <span className="project-modal-category">
                {CATEGORY_LABELS[selectedProject.category] || 'รีโนเวท'}
              </span>
            </div>

            <div className="project-modal-body">
              <h2 className="project-modal-title">{selectedProject.title}</h2>

              {detailLoading ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>กำลังโหลด...</p>
              ) : (
                <>
                  {projectDetail?.description && (
                    <div className="project-modal-description">
                      <h4>รายละเอียดโครงการ</h4>
                      <p>{projectDetail.description}</p>
                    </div>
                  )}

                  {projectDetail?.process_images?.length > 0 && (
                    <div className="project-modal-process">
                      <h4>ภาพระหว่างดำเนินการ</h4>
                      <div className="process-images-grid">
                        {projectDetail.process_images.map(img => (
                          <div key={img.id} className="process-image-item">
                            <img src={getImgSrc(img.img_path)} alt={img.caption || 'ระหว่างดำเนินการ'} />
                            {img.caption && <p>{img.caption}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!projectDetail?.description && !projectDetail?.process_images?.length && (
                    <p style={{ color: '#888', textAlign: 'center', padding: '1rem 0' }}>ยังไม่มีรายละเอียดเพิ่มเติม</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedProjects;

