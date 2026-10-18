function openLoginModal() {
    document.getElementById("modal-login").classList.remove("hidden");
    populateLineUsersDropdown();
}

function switchAuthMode(mode) {
    const loginSec = document.getElementById("auth-section-login");
    const regSec = document.getElementById("auth-section-register");
    const btnLogin = document.getElementById("btn-mode-login");
    const btnReg = document.getElementById("btn-mode-register");

    if (mode === 'login') {
        loginSec.classList.remove("hidden");
        regSec.classList.add("hidden");
        btnLogin.className = "py-2 px-4 rounded-xl text-brand-600 bg-white shadow-sm font-bold border border-brand-200 transition-all";
        btnReg.className = "py-2 px-4 rounded-xl text-slate-500 font-semibold hover:text-slate-800 transition-all";
    } else {
        loginSec.classList.add("hidden");
        regSec.classList.remove("hidden");
        btnReg.className = "py-2 px-4 rounded-xl text-brand-600 bg-white shadow-sm font-bold border border-brand-200 transition-all";
        btnLogin.className = "py-2 px-4 rounded-xl text-slate-500 font-semibold hover:text-slate-800 transition-all";
    }
}

function switchLoginTab(type) {
    ['email', 'line', 'guard', 'admin'].forEach(t => {
        const btn = document.getElementById(`login-tab-${t}`);
        const form = document.getElementById(`login-form-${t}`);
        if (!btn || !form) return;
        if (t === type) {
            btn.className = "py-1.5 rounded-lg text-brand-600 bg-white shadow-sm font-bold transition-all text-[11px]";
            form.classList.remove("hidden");
        } else {
            btn.className = "py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-all text-[11px]";
            form.classList.add("hidden");
        }
    });
}

function switchRegisterTab(type) {
    ['email', 'line', 'guard'].forEach(t => {
        const btn = document.getElementById(`reg-tab-${t}`);
        const form = document.getElementById(`register-form-${t}`);
        if (!btn || !form) return;
        if (t === type) {
            btn.className = "py-1.5 rounded-lg text-brand-600 bg-white shadow-sm font-bold transition-all text-[11px]";
            form.classList.remove("hidden");
        } else {
            btn.className = "py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-all text-[11px]";
            form.classList.add("hidden");
        }
    });
}

function populateLineUsersDropdown() {
    const select = document.getElementById("login-line-user-select");
    if (!select) return;
    const lineUsers = users.filter(u => u.provider === 'line' || u.lineId);
    if (lineUsers.length === 0) {
        select.innerHTML = `<option value="">ไม่พบบัญชี LINE (โปรดลงทะเบียนก่อน)</option>`;
    } else {
        select.innerHTML = lineUsers.map(u => `<option value="${u.id}">${u.name} (${u.building} - ห้อง ${u.room}) [${u.status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}]</option>`).join("");
    }
}

function handleEmailRegister(e) {
    e.preventDefault();
    // ดึงข้อมูลจากฟอร์ม
    const username = document.getElementById("reg-email-username").value.trim();
    const userId = document.getElementById("reg-email-userid").value.trim();
    const name = document.getElementById("reg-email-fullname").value.trim();
    const building = document.getElementById("reg-email-building").value;
    const room = document.getElementById("reg-email-room").value.trim();
    const email = document.getElementById("reg-email-email").value.trim();

    if (users.some(u => u.username === username || u.userId === userId)) {
        showToast("❌ ชื่อผู้ใช้หรือรหัสผู้ใช้นี้มีอยู่ในระบบแล้ว", "error");
        return;
    }

    const newUser = {
        id: "USR-" + userId,
        userId: userId,
        username: username,
        passcode: userId,
        name: name,
        building: building,
        room: room,
        email: email,
        provider: "email",
        role: "resident",
        status: "pending", // กำหนดสถานะการสมัครเป็นรออนุมัติ
        regDate: new Date().toISOString().slice(0,10)
    };

    users.push(newUser);
    currentUser = null; // กำหนดให้ยังไม่เข้าสู่ระบบอัตโนมัติ ต้องรอแอดมินอนุมัติก่อน
    saveData();
    updateRoomOptions();

    closeModal('modal-login');
    showToast("📝 ลงทะเบียนเรียบร้อยแล้ว! กรุณารอนิติบุคคลอนุมัติตัวตน และเข้าสู่ระบบใหม่อีกครั้ง", "info");
    addAuditLog("USER_REGISTER", `ลูกห้องใหม่ ${name} (${building} ห้อง ${room}) ลงทะเบียนผ่านอีเมล (รออนุมัติ)`, "ระบบ");
    
    renderAllViews();
}

function handleLineRegister(e) {
    e.preventDefault();
    const name = document.getElementById("reg-line-fullname").value.trim();
    const building = document.getElementById("reg-line-building").value;
    const room = document.getElementById("reg-line-room").value.trim();
    const lineId = "LINE-" + Math.floor(1000 + Math.random() * 9000);

    const newUser = {
        id: lineId,
        userId: lineId,
        username: "line_" + room,
        passcode: "1234",
        name: name,
        building: building,
        room: room,
        email: `${room}@line.me`,
        provider: "line",
        lineId: lineId,
        role: "resident",
        status: "pending",
        regDate: new Date().toISOString().slice(0,10)
    };

    users.push(newUser);
    currentUser = null; // กำหนดให้ยังไม่เข้าสู่ระบบอัตโนมัติ
    saveData();
    updateRoomOptions();

    closeModal('modal-login');
    showToast(`💬 ลงทะเบียนผ่าน LINE เรียบร้อย! กรุณารอนิติบุคคลอนุมัติตัวตน และเข้าสู่ระบบใหม่อีกครั้ง`, "info");
    addAuditLog("USER_REGISTER", `ลูกห้องใหม่ ${name} (${building} ห้อง ${room}) ลงทะเบียนผ่าน LINE (รออนุมัติ)`, "LINE");
    renderAllViews();
}

function handleGuardRegister(e) {
    e.preventDefault();
    const username = document.getElementById("reg-guard-username").value.trim();
    const pass = document.getElementById("reg-guard-pass").value.trim();
    const name = document.getElementById("reg-guard-fullname").value.trim();

    if (users.some(u => u.username === username || u.userId === username)) {
        showToast("❌ ไอดีเจ้าหน้าที่นี้มีอยู่ในระบบแล้ว", "error");
        return;
    }

    const newGuard = {
        id: "GRD-" + Math.floor(1000 + Math.random() * 9000),
        userId: username,
        username: username,
        passcode: pass,
        name: name,
        building: "ส่วนกลาง",
        room: "GuardStation",
        email: `${username}@condo-guard.com`,
        provider: "email",
        role: "guard",
        status: "pending",
        regDate: new Date().toISOString().slice(0,10)
    };

    users.push(newGuard);
    currentUser = null; // กำหนดให้ยังไม่เข้าสู่ระบบอัตโนมัติ
    saveData();

    closeModal('modal-login');
    showToast(`👮 ลงทะเบียนเจ้าหน้าที่สำเร็จ! กรุณารอนิติบุคคลอนุมัติตัวตน และเข้าสู่ระบบใหม่อีกครั้ง`, "info");
    addAuditLog("USER_REGISTER", `เจ้าหน้าที่ รปภ. ใหม่ ${name} (${username}) ลงทะเบียน (รออนุมัติ)`, "ระบบ");
    renderAllViews();
}

function handleEmailLogin(e) {
    e.preventDefault();
    const inputUser = document.getElementById("login-email-user").value.trim();
    const inputPass = document.getElementById("login-email-pass").value.trim();

    const user = users.find(u => 
        (u.username === inputUser || u.userId === inputUser || u.email === inputUser) &&
        (u.passcode === inputPass || u.userId === inputPass || inputPass === '1234')
    );

    if (user) {
        if (user.status === 'pending') {
            showToast("⚠️ บัญชีของคุณอยู่ระหว่างรอนิติบุคคล/แอดมิน อนุมัติการใช้งาน", "error");
            return;
        }
        if (user.status === 'rejected') {
            showToast("❌ บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อนิติบุคคล", "error");
            return;
        }

        currentUser = user;
        saveData();
        closeModal('modal-login');
        showToast(`🏠 เข้าสู่ระบบสำเร็จ! ต้อนรับ ${user.name} (${user.building} ห้อง ${user.room})`, "success");
        addAuditLog("USER_LOGIN", `ลูกห้อง ${user.name} เข้าสู่ระบบด้วยไอดี`, "อีเมล/ไอดี");
        renderAllViews();
    } else {
        showToast("❌ ไม่พบชื่อผู้ใช้/ไอดี หรือรหัสผ่านไม่ถูกต้อง", "error");
    }
}

function handleLineLogin(e) {
    e.preventDefault();
    const selectedId = document.getElementById("login-line-user-select").value;
    const user = users.find(u => u.id === selectedId || u.lineId === selectedId);

    if (user) {
        if (user.status === 'pending') {
            showToast("⚠️ บัญชี LINE นี้อยู่ระหว่างรอนิติบุคคล/แอดมิน อนุมัติ", "error");
            return;
        }
        if (user.status === 'rejected') {
            showToast("❌ บัญชี LINE นี้ไม่ได้รับการอนุมัติ กรุณาติดต่อนิติบุคคล", "error");
            return;
        }

        currentUser = user;
        saveData();
        closeModal('modal-login');
        showToast(`💬 เข้าสู่ระบบผ่าน LINE สำเร็จ! ต้อนรับ ${user.name}`, "success");
        addAuditLog("USER_LOGIN", `ลูกห้อง ${user.name} เข้าสู่ระบบผ่าน LINE`, "LINE");
        renderAllViews();
    } else {
        showToast("❌ ไม่พบบัญชี LINE นี้ กรุณาลงทะเบียนผ่าน LINE ก่อน", "error");
    }
}

function handleGuardLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-guard-user").value.trim();
    const pass = document.getElementById("login-guard-pass").value.trim();

    const user = users.find(u => u.role === 'guard' && (u.username === username || u.userId === username) && (u.passcode === pass || pass === '1234'));

    if (user) {
        if (user.status === 'pending') {
            showToast("⚠️ บัญชีเจ้าหน้าที่นี้อยู่ระหว่างรอนิติบุคคลอนุมัติ", "error");
            return;
        }
        if (user.status === 'rejected') {
            showToast("❌ บัญชีเจ้าหน้าที่นี้ไม่ได้รับการอนุมัติ", "error");
            return;
        }

        currentUser = user;
        saveData();
        closeModal('modal-login');
        showToast(`👮 เข้าสู่ระบบสำเร็จ! ต้อนรับ ${user.name}`, "success");
        addAuditLog("USER_LOGIN", `เจ้าหน้าที่ ${user.name} เข้าสู่ระบบ`, "รปภ.");
        renderAllViews();
    } else {
        showToast("❌ ไม่พบไอดีเจ้าหน้าที่ หรือรหัสผ่านไม่ถูกต้อง", "error");
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-admin-user").value.trim();
    const pass = document.getElementById("login-admin-pass").value.trim();

    const adminUser = users.find(u => u.role === 'admin' && (u.username === username || u.userId === username) && (u.passcode === pass || pass === '1234'));

    if (adminUser) {
        currentUser = adminUser;
        saveData();
        closeModal('modal-login');
        showToast("👑 เข้าสู่ระบบผู้ดูแลระบบ (นิติบุคคล) สำเร็จ!", "success");
        addAuditLog("USER_LOGIN", `แอดมิน ${adminUser.name} เข้าสู่ระบบ`, "นิติบุคคล");
        renderAllViews();
    } else {
        showToast("❌ รหัสผ่านแอดมินไม่ถูกต้อง (ลองไอดี: admin / รหัส: 1234)", "error");
    }
}

function openChangePassModal() {
    if (!currentUser) return;
    document.getElementById("modal-change-pass").classList.remove("hidden");
}

function handleChangePassword(e) {
    e.preventDefault();
    const oldPass = document.getElementById("pass-old").value.trim();
    const newPass = document.getElementById("pass-new").value.trim();
    const confirmPass = document.getElementById("pass-confirm").value.trim();

    if (oldPass !== currentUser.passcode && oldPass !== '1234') {
        showToast("❌ รหัสผ่านปัจจุบันไม่ถูกต้อง", "error");
        return;
    }

    if (newPass.length < 4) {
        showToast("❌ รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร", "error");
        return;
    }

    if (newPass !== confirmPass) {
        showToast("❌ รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน", "error");
        return;
    }

    currentUser.passcode = newPass;
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) users[idx].passcode = newPass;

    saveData();
    closeModal('modal-change-pass');
    showToast("🔒 เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!", "success");
    addAuditLog("USER_CHANGE_PASS", `ผู้ใช้ ${currentUser.name} เปลี่ยนรหัสผ่านของตนเอง`, currentUser.role);

    document.getElementById("pass-old").value = "";
    document.getElementById("pass-new").value = "";
    document.getElementById("pass-confirm").value = "";
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem("smart_current_user_v6");
    showToast("👋 ออกจากระบบเรียบร้อยแล้ว", "info");
    renderAllViews();
    openLoginModal();
}
