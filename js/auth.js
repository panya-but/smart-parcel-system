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
    ['email', 'line', 'guard'].forEach(t => {
        const btn = document.getElementById(`login-tab-${t}`);
        const form = document.getElementById(`login-form-${t}`);
        if (t === type) {
            btn.className = "py-2 rounded-xl text-brand-600 bg-white shadow-sm transition-all font-bold";
            form.classList.remove("hidden");
        } else {
            btn.className = "py-2 rounded-xl text-slate-500 hover:text-slate-800 transition-all";
            form.classList.add("hidden");
        }
    });
}

function switchRegisterTab(type) {
    ['email', 'line'].forEach(t => {
        const btn = document.getElementById(`reg-tab-${t}`);
        const form = document.getElementById(`register-form-${t}`);
        if (t === type) {
            btn.className = "py-2 rounded-xl text-brand-600 bg-white shadow-sm transition-all font-bold";
            form.classList.remove("hidden");
        } else {
            btn.className = "py-2 rounded-xl text-slate-500 hover:text-slate-800 transition-all";
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
        select.innerHTML = lineUsers.map(u => `<option value="${u.id}">${u.name} (${u.building} - ห้อง ${u.room})</option>`).join("");
    }
}

function handleEmailRegister(e) {
    e.preventDefault();
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
        role: "resident"
    };

    users.push(newUser);
    saveData();
    updateRoomOptions();

    showToast("🎉 ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบด้วยไอดีของคุณ", "success");
    addAuditLog("USER_REGISTER", `ลงทะเบียนผู้ใช้ใหม่ ${name} (${building} ห้อง ${room}) ผ่านอีเมล`, "ระบบ");
    
    switchAuthMode('login');
    document.getElementById("login-email-user").value = username;
    document.getElementById("login-email-pass").value = userId;
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
        role: "resident"
    };

    users.push(newUser);
    saveData();
    updateRoomOptions();

    currentUser = newUser;
    closeModal('modal-login');
    showToast(`💬 ลงทะเบียนและเข้าสู่ระบบผ่าน LINE สำเร็จ! ต้อนรับ ${name}`, "success");
    addAuditLog("USER_REGISTER", `ลงทะเบียนลูกห้องใหม่ ${name} (${building} ห้อง ${room}) ผ่าน LINE`, "LINE");
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
        currentUser = user;
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
        currentUser = user;
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
    const pass = document.getElementById("login-guard-pass").value;

    if (pass === '1234') {
        currentUser = { role: 'guard', name: 'เจ้าหน้าที่ รปภ.', room: 'GuardStation', building: 'ส่วนกลาง' };
        closeModal('modal-login');
        showToast("👮 เข้าสู่ระบบสำเร็จในฐานะ เจ้าหน้าที่ รปภ.", "success");
        addAuditLog("USER_LOGIN", `เจ้าหน้าที่ รปภ. เข้าสู่ระบบ`, "รปภ.");
        renderAllViews();
    } else {
        showToast("❌ รหัสผ่านไม่ถูกต้อง (ลองใช้รหัส: 1234)", "error");
    }
}

function quickLogin(role) {
    if (role === 'guard') {
        currentUser = { role: 'guard', name: 'เจ้าหน้าที่ รปภ.', room: 'GuardStation', building: 'ส่วนกลาง' };
    } else if (role === 'resident') {
        currentUser = users.find(u => u.role === 'resident') || users[0];
    } else if (role === 'admin') {
        currentUser = { role: 'admin', name: 'ผู้ดูแลระบบ', room: 'Admin', building: 'ส่วนกลาง' };
    }

    closeModal('modal-login');
    showToast(`⚡ เข้าสู่ระบบแบบด่วน: ${currentUser.name}`, "info");
    renderAllViews();
}

function logout() {
    currentUser = { role: 'guard', name: 'เจ้าหน้าที่ รปภ.', room: 'GuardStation', building: 'ส่วนกลาง' };
    showToast("👋 ออกจากระบบเรียบร้อยแล้ว", "info");
    renderAllViews();
    openLoginModal();
}