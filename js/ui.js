function updateHeaderBadge() {
    const avatar = document.getElementById("user-role-avatar");
    const nameEl = document.getElementById("user-display-name");
    const roleEl = document.getElementById("user-display-role");
    const badge = document.getElementById("user-profile-badge");
    const btnChangePass = document.getElementById("btn-header-change-pass");
    const btnLogin = document.getElementById("btn-header-login");
    const btnLogout = document.getElementById("btn-header-logout");

    // หากยังไม่ได้เข้าสู่ระบบ หรือยังไม่ได้รับการอนุมัติ -> ซ่อนปุ่มออกจากระบบ แสดงปุ่มเข้าสู่ระบบ
    if (!currentUser || currentUser.status !== 'approved') {
        if (badge) badge.classList.add("hidden");
        if (btnChangePass) btnChangePass.classList.add("hidden");
        if (btnLogin) btnLogin.classList.remove("hidden");
        if (btnLogout) badge.classList.add("hidden");
        return;
    }

    // เมื่อเข้าสู่ระบบและได้รับการอนุมัติแล้ว -> ซ่อนปุ่มเข้าสู่ระบบ แสดงปุ่มออกจากระบบ
    if (badge) badge.classList.remove("hidden");
    if (btnChangePass) btnChangePass.classList.remove("hidden");
    if (btnLogin) btnLogin.classList.add("hidden");      // ซ่อนปุ่ม เข้าสู่ระบบ / สมัครสมาชิก
    if (btnLogout) btnLogout.classList.remove("hidden"); // แสดงปุ่ม ออกจากระบบ

    if (currentUser.role === 'guard') {
        avatar.textContent = "G"; avatar.className = "w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold";
        nameEl.textContent = currentUser.name; roleEl.textContent = "บทบาท: Security Guard";
    } else if (currentUser.role === 'resident') {
        avatar.textContent = currentUser.provider === 'line' ? "L" : "R";
        avatar.className = currentUser.provider === 'line' 
            ? "w-7 h-7 rounded-lg bg-line-500 text-white flex items-center justify-center text-xs font-bold"
            : "w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold";
        nameEl.textContent = currentUser.name; 
        roleEl.textContent = `ตึก ${currentUser.building} - ห้อง ${currentUser.room} (${currentUser.provider === 'line' ? 'LINE' : 'Email'})`;
    } else {
        avatar.textContent = "A"; avatar.className = "w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold";
        nameEl.textContent = currentUser.name; roleEl.textContent = "บทบาท: Administrator (นิติบุคคล)";
    }
}

function renderAllViews() {
    updateHeaderBadge();

    const viewGuest = document.getElementById("view-guest");

    // ซ่อนแผงควบคุมทั้งหมดหากยังไม่อนุมัติหรือยังไม่ได้เข้าสู่ระบบ
    if (!currentUser || currentUser.status !== 'approved') {
        ['guard', 'resident', 'admin'].forEach(r => {
            const v = document.getElementById(`view-${r}`);
            if (v) v.classList.add("hidden");
        });
        if (viewGuest) viewGuest.classList.remove("hidden");
        return;
    }

    if (viewGuest) viewGuest.classList.add("hidden");

    // แสดงเฉพาะแผงควบคุมตามบทบาทผู้ใช้งาน
    ['guard', 'resident', 'admin'].forEach(r => {
        const view = document.getElementById(`view-${r}`);
        if (view) {
            if (r === currentUser.role) view.classList.remove("hidden");
            else view.classList.add("hidden");
        }
    });

    if (currentUser.role === 'guard') renderGuardParcelTable();
    if (currentUser.role === 'resident') renderResidentCards();
    if (currentUser.role === 'admin') { 
        renderPendingUsersTable(); 
        renderUserManagementTable(); 
        renderAdminTable(); 
        renderAuditLogs(); 
    }

    updateStats();
}

function updateStats() {
    const pending = parcels.filter(p => p.overallStatus === 'pending').length;
    const confirmed = parcels.filter(p => p.overallStatus === 'confirmed').length;
    const canceled = parcels.filter(p => p.overallStatus === 'canceled').length;
    const completed = parcels.filter(p => p.overallStatus === 'completed').length;

    const el1 = document.getElementById("stat-guard-pending"); if (el1) el1.textContent = pending;
    const el2 = document.getElementById("stat-guard-confirmed"); if (el2) el2.textContent = confirmed;
    const el3 = document.getElementById("stat-guard-canceled"); if (el3) el3.textContent = canceled;

    const el4 = document.getElementById("stat-admin-total"); if (el4) el4.textContent = parcels.length;
    const el5 = document.getElementById("stat-admin-pending"); if (el5) el5.textContent = pending;
    const el6 = document.getElementById("stat-admin-completed"); if (el6) el6.textContent = completed;
    const el7 = document.getElementById("stat-admin-canceled"); if (el7) el7.textContent = canceled;

    if (currentUser && currentUser.role === 'resident') {
        const myParcels = parcels.filter(p => p.building === currentUser.building && p.room === currentUser.room);
        const el8 = document.getElementById("stat-res-pending"); if (el8) el8.textContent = myParcels.filter(p => p.overallStatus === 'pending').length;
        const el9 = document.getElementById("stat-res-confirmed"); if (el9) el9.textContent = myParcels.filter(p => p.overallStatus === 'confirmed').length;
        const el10 = document.getElementById("stat-res-history"); if (el10) el10.textContent = myParcels.filter(p => p.overallStatus === 'completed').length;
    }
}

function getStatusBadge(status) {
    if (status === 'pending') return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">รอตรวจสอบ</span>`;
    if (status === 'confirmed') return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700">ยืนยันแล้ว</span>`;
    if (status === 'completed') return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">รับเรียบร้อย</span>`;
    if (status === 'canceled') return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">ยกเลิก/ปฏิเสธ</span>`;
    return `<span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">-</span>`;
}

function getItemStatusBadge(status) {
    if (status === 'pending') return `<span class="text-[10px] font-semibold text-amber-600">⏳ รอยืนยัน</span>`;
    if (status === 'confirmed') return `<span class="text-[10px] font-semibold text-brand-600">✅ ยืนยันแล้ว</span>`;
    if (status === 'completed') return `<span class="text-[10px] font-semibold text-emerald-600">🚚 รับแล้ว</span>`;
    if (status === 'canceled') return `<span class="text-[10px] font-semibold text-red-600">❌ ปฏิเสธ</span>`;
    return `-`;
}

function openImageZoom(imgSrc) {
    if (!imgSrc) { showToast("ℹ️ รูปภาพนี้ถูกลบตามนโยบายคุ้มครองข้อมูล PDPA เรียบร้อยแล้ว", "info"); return; }
    document.getElementById("modal-zoom-img").src = imgSrc;
    document.getElementById("modal-image-zoom").classList.remove("hidden");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
}

function showToast(message, type = 'info') {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    let bgColor = "bg-slate-800 text-white";
    if (type === 'success') bgColor = "bg-emerald-600 text-white";
    if (type === 'error') bgColor = "bg-red-600 text-white";

    toast.className = `${bgColor} p-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all transform duration-300 translate-y-2 opacity-0`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => { toast.classList.remove("translate-y-2", "opacity-0"); }, 10);
    setTimeout(() => { toast.classList.add("opacity-0"); setTimeout(() => toast.remove(), 300); }, 3500);
}

function showLinePopup(text) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const popup = document.createElement("div");

    popup.className = "bg-emerald-600 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-400 line-pop-in pointer-events-auto space-y-1";
    popup.innerHTML = `
        <div class="flex items-center justify-between border-b border-emerald-500/60 pb-1.5">
            <span class="text-[11px] font-bold flex items-center gap-1.5">
                <i class="fa-brands fa-line text-lg"></i> LINE Notification
            </span>
            <span class="text-[9px] bg-emerald-700 px-1.5 py-0.5 rounded text-emerald-100">เมื่อครู่นี้</span>
        </div>
        <p class="text-xs whitespace-pre-line leading-relaxed">${text}</p>
    `;

    container.appendChild(popup);
    setTimeout(() => {
        popup.classList.add("opacity-0", "transition-opacity", "duration-500");
        setTimeout(() => popup.remove(), 500);
    }, 5000);
}
