import React from 'react';

const PageHeader = ({ title, description, action }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-[var(--color-dark-turquoise)]">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-[var(--color-grey-text)] mt-1">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
