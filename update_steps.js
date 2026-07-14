const fs = require('fs');

let content = fs.readFileSync('src/modules/ads/CreateAdPage.jsx', 'utf-8');

// 1. Update form initial state
content = content.replace(
  /target_start_time: '00:00', target_end_time: '23:59', daily_shift: '24h',\s*interval_minutes: '', total_cost: '', package_name: '',/g,
  `time_target: 'full_day', plays_per_hour: 5, total_cost: '',`
);

// 2. Update steps array definition
content = content.replace(
  /const steps = \[\s*\{ id: 1, title: 'المعلومات الأساسية'[\s\S]*?\];/g,
  `const steps = [
        { id: 1, title: 'الاستهداف المكاني', subtitle: 'تحديد الشاشات' },
        { id: 2, title: 'التوقيت والكثافة', subtitle: 'التاريخ وعدد الظهور' },
        { id: 3, title: 'المحتوى والبيانات', subtitle: 'العنوان ورفع المادة' },
        { id: 4, title: 'التسعير والاعتماد', subtitle: 'مراجعة ختامية' }
    ];`
);

// 3. Update nextStep logic
let nextStepLogic = `
        if (currentStep === 1) {
            if (selectedScreens.length === 0) {
                addToast('الرجاء تحديد شاشة واحدة على الأقل', 'warning');
                return;
            }
        }
        if (currentStep === 2) {
            if (!form.start_date || !form.end_date) {
                addToast('الرجاء تحديد تاريخ الحملة بالكامل', 'warning');
                return;
            }
            if (!form.plays_per_hour || form.plays_per_hour < 1) {
                addToast('الرجاء تحديد الكثافة (مرات الظهور في الساعة) برقم صحيح', 'warning');
                return;
            }
        }
        if (currentStep === 3) {
            if (!form.title.trim()) {
                addToast('الرجاء كتابة عنوان الحملة قبل المتابعة', 'warning');
                return;
            }
            if (!form.file) {
                addToast('الرجاء رفع المادة المرئية (فيديو أو صورة)', 'warning');
                return;
            }
        }
        if (currentStep < 4) setCurrentStep(prev => prev + 1);
`;
content = content.replace(/const nextStep = \(\) => \{[\s\S]*?if \(currentStep < 5\) setCurrentStep\(prev => prev \+ 1\);\n\s*\};/g, `const nextStep = () => {${nextStepLogic}\n    };`);

// 4. In handleCalculateCost
content = content.replace(
  /if \(!form.start_date \|\| !form.end_date \|\| !form.interval_minutes\) \{[\s\S]*?interval_minutes: form.interval_minutes/g,
  `if (!form.start_date || !form.end_date || !form.plays_per_hour) {
            addToast('يرجى التأكد من تعبئة: جدول العرض التاريخي وكثافة البث', 'warning');
            return;
        }
        setCostLoading(true);
        try {
            let sd = '', ed = '';
            if (form.start_date) sd = form.start_date.split('T')[0];
            if (form.end_date) ed = form.end_date.split('T')[0];

            const payload = {
                screen_ids: selectedScreens,
                start_date: sd,
                end_date: ed,
                time_target: form.time_target,
                plays_per_hour: form.plays_per_hour`
);

// 5. In handleSubmit
content = content.replace(
  /formData.append\('target_start_time', form.target_start_time\);\n\s*formData.append\('target_end_time', form.target_end_time\);/g,
  `formData.append('time_target', form.time_target);
        formData.append('plays_per_hour', form.plays_per_hour);`
);

content = content.replace(
  /if \(\['interval_minutes', 'total_cost'\]\.includes\(key\)\)/g,
  `if (['plays_per_hour', 'total_cost'].includes(key))`
);

// 6. JSX Step view conditions swap
// Move Step 3 to Step 1
content = content.replace(/\{currentStep === 3 && \(/g, '{currentStep === 1 && /* Map / Targeting UI */ (');
// Move Step 1 to Step 3
content = content.replace(/\{currentStep === 1 && \(/g, '{currentStep === 3 && /* Basic Info UI */ (');

// Rename old step 4 to also trigger on Step 3
content = content.replace(/\{currentStep === 4 && \(/g, '{currentStep === 3 && /* Upload Media UI */ (');

// Move Step 5 to Step 4
content = content.replace(/\{currentStep === 5 && \(/g, '{currentStep === 4 && /* Invoice UI */ (');

// Submits checks
content = content.replace(/currentStep < 5 \? /g, 'currentStep < 4 ? ');
content = content.replace(/\{currentStep < 5\)/g, '{currentStep < 4)');
content = content.replace(/if \(currentStep < 5\)/g, 'if (currentStep < 4)');
content = content.replace(/steps.length - 1/g, '3');

content = content.replace(/if \(selectedScreens.length === 0\) \{\n\s*addToast\('عملية مرفوضة: يجب اسناد الحملة إلى شاشة عرض في قائمة الأهداف \(الخطوة 4\)', 'warning'\);/g,
`if (selectedScreens.length === 0) {
            addToast('عملية مرفوضة: يجب اسناد الحملة إلى شاشة عرض أولاً', 'warning');`
);

// 7. Inject the new Step 2 (Scheduling & Intensity UI)
let step2Pattern = /\{\/\* STEP 2: SCHEDULING & FREQUENCY \*\/\}\s*\{currentStep === 2 && \([\s\S]*?<\/motion\.div>\s*\)\}/;

let newStep2 = `
                                    {/* STEP 2: SCHEDULING & INTENSITY */}
                                    {currentStep === 2 && (
                                        <motion.div
                                            key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                            className="bg-white rounded-2xl border border-border-color p-6 md:p-8 shadow-sm"
                                        >
                                            <div className="mb-8">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                                                    <h3 className="font-title-lg text-title-lg text-on-background">الجدولة الزمنية وكثافة البث</h3>
                                                </div>
                                                <p className="font-body-md text-body-md text-on-surface-variant">تحديد نطاق الأيام وأوقات الذروة وعدد مرات الظهور.</p>
                                            </div>

                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10 bg-surface-container-low/50 p-6 rounded-2xl border border-border-color">
                                                <div>
                                                    <label className="block font-title-sm text-title-sm text-on-background mb-3">
                                                        تاريخ الانطلاق <span className="text-error">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="date"
                                                            value={form.start_date}
                                                            onChange={(e) => { setForm(p => ({ ...p, start_date: e.target.value })); if (calculatedCost) setCalculatedCost(null); }}
                                                            className="w-full border border-border-color bg-white rounded-xl px-5 py-4 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                                                            dir="ltr"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block font-title-sm text-title-sm text-on-background mb-3">
                                                        تاريخ الانتهاء <span className="text-error">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="date"
                                                            value={form.end_date}
                                                            onChange={(e) => { setForm(p => ({ ...p, end_date: e.target.value })); if (calculatedCost) setCalculatedCost(null); }}
                                                            className="w-full border border-border-color bg-white rounded-xl px-5 py-4 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                                                            dir="ltr"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-px bg-border-color w-full mb-8"></div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <h4 className="font-title-sm text-title-sm text-on-background mb-4 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-outline">schedule</span>
                                                        حدد أوقات العرض (الاستهداف الزمني)
                                                    </h4>
                                                    <div className="flex flex-col gap-3">
                                                        <label className={\`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all \${form.time_target === 'full_day' ? 'bg-primary-container/20 border-primary ring-1 ring-primary' : 'bg-white border-border-color'}\`}>
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined text-primary">all_inclusive</span>
                                                                <div>
                                                                    <p className="font-bold text-on-background text-[15px]">عرض طوال اليوم</p>
                                                                    <p className="text-[12px] text-on-surface-variant">الظهور في أوقات الذروة والأوقات العادية.</p>
                                                                </div>
                                                            </div>
                                                            <input type="radio" checked={form.time_target === 'full_day'} onChange={() => {setForm(p => ({...p, time_target: 'full_day'})); setCalculatedCost(null);}} className="sr-only" />
                                                        </label>
                                                        <label className={\`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all \${form.time_target === 'peak' ? 'bg-primary-container/20 border-primary ring-1 ring-primary' : 'bg-white border-border-color'}\`}>
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined text-error">local_fire_department</span>
                                                                <div>
                                                                    <p className="font-bold text-on-background text-[15px]">أوقات الذروة فقط (Peak)</p>
                                                                    <p className="text-[12px] text-on-surface-variant">استهداف وقت الزحام الأعلى (سعر الذروة).</p>
                                                                </div>
                                                            </div>
                                                            <input type="radio" checked={form.time_target === 'peak'} onChange={() => {setForm(p => ({...p, time_target: 'peak'})); setCalculatedCost(null);}} className="sr-only" />
                                                        </label>
                                                        <label className={\`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all \${form.time_target === 'offpeak' ? 'bg-primary-container/20 border-primary ring-1 ring-primary' : 'bg-white border-border-color'}\`}>
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined text-secondary">bedtime</span>
                                                                <div>
                                                                    <p className="font-bold text-on-background text-[15px]">الأوقات العادية والركود</p>
                                                                    <p className="text-[12px] text-on-surface-variant">لميزانية اقتصادية مرنة وجيدة.</p>
                                                                </div>
                                                            </div>
                                                            <input type="radio" checked={form.time_target === 'offpeak'} onChange={() => {setForm(p => ({...p, time_target: 'offpeak'})); setCalculatedCost(null);}} className="sr-only" />
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="bg-surface-container-lowest border border-border-color rounded-2xl p-6 shadow-sm">
                                                    <h4 className="font-title-sm text-title-sm text-on-background mb-2 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-primary text-[22px]">auto_graph</span>
                                                        كثافة الظهور (في الساعة الواحدة)
                                                    </h4>
                                                    <p className="font-caption text-caption text-on-surface-variant mb-6">كم مرة ترغب بعرض إعلانك في الساعة الواحدة؟</p>
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button type="button" onClick={() => {setForm(p => ({...p, plays_per_hour: Math.max(1, (p.plays_per_hour || 5) - 1)})); setCalculatedCost(null);}} className="w-12 h-12 rounded-full border border-border-color bg-white flex items-center justify-center hover:bg-surface-container transition-colors text-[24px] font-bold text-error">-</button>
                                                        <input type="number" 
                                                            value={form.plays_per_hour} 
                                                            onChange={(e) => {setForm(p => ({...p, plays_per_hour: Number(e.target.value)})); setCalculatedCost(null);}}
                                                            className="w-24 text-center text-3xl font-extrabold bg-transparent border-none focus:outline-none focus:ring-0 text-primary"
                                                        />
                                                        <button type="button" onClick={() => {setForm(p => ({...p, plays_per_hour: (p.plays_per_hour || 5) + 1})); setCalculatedCost(null);}} className="w-12 h-12 rounded-full border border-border-color bg-white flex items-center justify-center hover:bg-surface-container transition-colors text-[24px] font-bold text-green-600">+</button>
                                                    </div>
                                                    <div className="text-center mt-6">
                                                        <div className="bg-primary-container/30 text-primary rounded-xl py-3 px-4 text-sm font-bold border border-primary-container">
                                                            الإجمالي: {form.plays_per_hour} مرات في الساعة
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
`;
content = content.replace(step2Pattern, newStep2);

fs.writeFileSync('src/modules/ads/CreateAdPage.jsx', content);
console.log('Update Complete!');
