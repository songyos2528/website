import React, { useState, useEffect } from 'react';
import { getBusinessInfo } from '../firebase/api';
import './LineButton.css';

const LineButton = () => {
  const [lineId, setLineId] = useState('');
  const [messengerUrl, setMessengerUrl] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getBusinessInfo()
      .then(data => {
        if (data?.line_id) setLineId(data.line_id);
        if (data?.messenger_url) setMessengerUrl(data.messenger_url);
      })
      .catch(err => console.error('Error fetching business info:', err));
  }, []);

  // @ = Official Account → line.me/R/ti/p/@id
  // ไม่มี @ = LINE User ID → line.me/ti/p/~id
  const lineUrl = lineId.startsWith('@')
    ? `https://line.me/R/ti/p/${lineId}`
    : `https://line.me/ti/p/~${lineId}`;

  // Hide the whole widget until at least one channel is configured in Admin,
  // so customers never see a button that links nowhere.
  if (!lineId && !messengerUrl) return null;

  return (
    <div className="float-stack">
      {/* LINE */}
      {lineId && (
      <a
        href={lineUrl}
        target="_blank"
        rel="noreferrer"
        className={`float-btn float-btn--line ${open ? 'visible' : ''}`}
        title="ติดต่อผ่าน LINE"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M22.28 10.15c0-4.63-4.59-8.4-10.23-8.4C6.42 1.75 1.83 5.52 1.83 10.15c0 4.14 3.52 7.64 8.28 8.28.32.07.76.22.88.51.1.26.07.66.03.93l-.15 1c-.05.29-.22 1.05.92.57 1.13-.48 6.13-3.6 8.4-6.2 1.34-1.57 2.09-3.3 2.09-5.09zm-13.62 1.63H6.84c-.31 0-.57-.26-.57-.57V8.12c0-.31.26-.57.57-.57h1.82c.31 0 .57.26.57.57v.72c0 .31-.26.57-.57.57H7.42v1.23h1.23c.31 0 .57.26.57.57v.57c0 .32-.25.57-.56.57zm2.46 0h-1.12c-.31 0-.57-.26-.57-.57V8.12c0-.31.26-.57.57-.57h1.12c.31 0 .57.26.57.57v3.09c0 .32-.26.57-.57.57zm5.55 0h-1.39l-1.85-2.54v2.54c0 .31-.26.57-.57.57h-1.12c-.31 0-.57-.26-.57-.57V8.12c0-.31.26-.57.57-.57h1.39l1.85 2.54V8.12c0-.31.26-.57.57-.57h1.12c.31 0 .57.26.57.57v3.09c0 .32-.26.57-.57.57z"/>
        </svg>
        <span className="float-tooltip">LINE</span>
      </a>
      )}

      {/* Messenger */}
      {messengerUrl && (
      <a
        href={messengerUrl}
        target="_blank"
        rel="noreferrer"
        className={`float-btn float-btn--messenger ${open ? 'visible' : ''}`}
        title="ติดต่อผ่าน Messenger"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.929 1.46 5.546 3.746 7.255V22l3.42-1.878c.913.253 1.882.39 2.834.39 5.523 0 10-4.144 10-9.269C22 6.145 17.523 2 12 2zm.993 12.478l-2.548-2.718-4.971 2.718 5.469-5.803 2.61 2.718 4.909-2.718-5.469 5.803z"/>
        </svg>
        <span className="float-tooltip">Messenger</span>
      </a>
      )}

      {/* Toggle button */}
      <button
        className={`float-btn float-btn--toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        title={open ? 'ปิด' : 'ติดต่อเรา'}
        aria-label="toggle contact"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        )}
      </button>
    </div>
  );
};

export default LineButton;
