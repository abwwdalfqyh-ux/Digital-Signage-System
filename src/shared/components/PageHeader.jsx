import React from 'react';

const PageHeader = ({ title, description, action }) => {
    return (
        <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
            dir="rtl"
        >
            <div>
                {/* Gold accent line */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: description ? '4px' : '0',
                }}>
                    <div style={{
                        width: '4px',
                        height: '26px',
                        borderRadius: '99px',
                        background: 'linear-gradient(180deg,#c8a84b,#9a7b2e)',
                        flexShrink: 0,
                    }} />
                    <h1 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: 800,
                        color: '#1c3a2d',
                        letterSpacing: '-0.01em',
                        fontFamily: "'Segoe UI', Tahoma, sans-serif",
                    }}>
                        {title}
                    </h1>
                </div>

                {description && (
                    <p style={{
                        margin: '4px 0 0 14px',
                        fontSize: '13px',
                        color: '#6b7b5e',
                        fontWeight: 500,
                    }}>
                        {description}
                    </p>
                )}
            </div>

            {action && (
                <div style={{ flexShrink: 0 }}>
                    {action}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
