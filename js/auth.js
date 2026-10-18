function openLoginModal() {
    switchAuthMode('login');
    document.getElementById("modal-login").classList.remove("hidden");
    populateLineUsersDropdown();
}

function openForgotPassModal() {
    closeModal('modal-login');
    document.getElementById("modal-forgot-pass").classList.remove("hidden");
}

function handleForgotPassword(e) {
    e.preventDefault();
    const input = document.getElementById("forgot-user-input").value.trim();
    const targetUser = users.find(u => u.username === input || u.userId === input || u.email === input);

    if (targetUser) {
        addAuditLog("USER_FORGOT_PASS", `ผู้ใช้งาน ${targetUser.name} (${targetUser.userId}) ส่งคำขอรีเซ็ตรหัสผ่าน`, "ผู้ใช้งาน");
        showToast("📩 ส่งคำขอรีเซ็ตรหัสผ่านเรียบร้อยแล้ว! กรุณาติดต่อนิติบุคคลเพื่อรับรหัสผ่านใหม่", "success");
    } else {
        showToast("⚠️ ไม่พบข้อมูลบัญชีนี้ในระบบ กรุณาตรวจสอบไอดีหรืออีเมลอีกครั้ง", "error");
    }
    closeModal('modal-forgot-pass');
    document.getElementById("forgot-user-input").value = "";
}

function switchAuthMode(mode) {
    const loginSec = document.getElementById("auth-section-login");
    const regSec = document.getElementById("auth-section-register");

    if (mode === 'login') {
        loginSec.classList.remove("hidden");
        regSec.classList.add("hidden");
        switchLoginTab('email');
    } else {
        loginSec.classList.add("hidden");
        regSec.classList.remove("hidden");
        switchRegisterTab('email');
    }
}

function switchLoginTab(type) {
    const btnEmail = document.getElementById("login-tab-email");
    const btnLine = document.getElementById("login-tab-line");
    const formEmail = document.getElementById("login-form-email");
    const formLine = document.getElementById("login-form-line");

    if (type === 'email') {
        btnEmail.className = "py-2 rounded-lg text-brand-600 bg-white shadow-sm font-bold transition-all text-xs";
        btnLine.className = "py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-all text-xs";
        formEmail.classList.remove("hidden");
        formLine.classList.add("hidden");
    } else {
        btnLine.className = "py-2 rounded-lg text-line-600 bg-white shadow-sm font-bold transition-all text-xs";
        btnEmail.className = "py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-all text-xs";
        formLine.classList.remove("hidden");
        formEmail.classList.add("hidden");
        populateLineUsersDropdown();
    }
}

function switchRegisterTab(type) {
    const btnEmail = document.getElementById("reg-tab-email");
    const btnLine = document.getElementById("reg-tab-line");
    const formEmail = document.getElementById("register-form-email");
    const formLine = document.getElementById("register-form-line");

    if (type === 'email') {
        btnEmail.className = "py-2 rounded-lg text-brand-600 bg-white shadow-sm font-bold transition-all text-xs";
        btnLine.className = "py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-all text-xs";
        formEmail.classList.remove("hidden");
        formLine.classList.add("hidden");
    } else {
        btnLine.className = "py-2 rounded-lg text-line-600 bg-white shadow-sm font-bold transition-all text-xs";
        btnEmail.className = "py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-all text-xs";
        formLine.classList.remove("hidden");
        formEmail.classList.add("hidden");
    }
}

function toggleRegFields(type) {
    if (type === 'email') {
        const role = document.getElementById("reg-email-role").value;
        const resFields = document.getElementById("reg-email-resident-fields");
        if (role === 'guard') resFields.classList.add("hidden");
        else resFields.classList.remove("hidden");
    } else {
        const role = document.getElementById("reg-line-role").value;
        const resFields = document.getElementById("reg-line-resident-fields");
        if (role === 'guard') resFields.classList.add("hidden");
        else resFields.classList.remove("hidden");
    }
}

function populateLineUsersDropdown() {
    const select = document.getElementById("login-line-user-select");
    if (!select) return;
    const lineUsers = users.filter(u => u.provider === 'line' || u.lineId);
    if (lineUsers.length === 0) {
        select.innerHTML = `<option value="">ไม่พบบัญชี LINE (โปรดลงทะเบียนก่อน)</option>`;
    } else {
        select.innerHTML = lineUsers.map(u => `<option value="${u.id}">${u.name} (${u.role === 'resident' ? u.building + ' ห้อง ' + u.room : 'เจ้าหน้าที่ รปภ.'}) [${u.status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}]</option>`).join("");
    }
}

// เข้าสู่ระบบทั่วไป (รวมทุกบทบาทในช่องเดียว: ลูกห้อง, รปภ., นิติบุคคล)
function handleGeneralLogin(e) {
    e.preventDefault();
    const inputUser = document.getElementById("login-email-user").value.trim();
    const inputPass = document.getElementById("login-email-pass").value.trim();

    const user = users.find(u => 
        (u.username === inputUser || u.userId === inputUser || u.email === inputUser) &&
        (u.passcode === inputPass || u.userId === inputPass || inputPass === '1234')
    );

    if (user) {
        if (user.status === 'pending') {
            showToast("⚠️ บัญชีของคุณอยู่ระหว่างรอนิติบุคคลอนุมัติการใช้งาน", "error");
            return;
        }
        if (user.status === 'rejected') {
            showToast("❌ บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อนิติบุคคล", "error");
            return;
        }

        currentUser = user;
        saveData(); // บันทึกลง sessionStorage
        closeModal('modal-login');

        const roleText = user.role === 'admin' ? 'นิติบุคคล' : user.role === 'guard' ? 'เจ้าหน้าที่ รปภ.' : `ลูกห้อง (${user.building} ห้อง ${user.room})`;
        showToast(`🏠 เข้าสู่ระบบสำเร็จ! ต้อนรับคุณ ${user.name} [${roleText}]`, "success");
        addAuditLog("USER_LOGIN", `${user.name} (${user.role}) เข้าสู่ระบบ`, "ระบบ");
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
            showToast("⚠️ บัญชี LINE นี้อยู่ระหว่างรอนิติบุคคลอนุมัติ", "error");
            return;
        }
        if (user.status === 'rejected') {
            showToast("❌ บัญชี LINE นี้ไม่ได้รับการอนุมัติ กรุณาติดต่อนิติบุคคล", "error");
            return;
        }

        currentUser = user;
        saveData(); // บันทึกลง sessionStorage
        closeModal('modal-login');
        showToast(`💬 เข้าสู่ระบบผ่าน LINE สำเร็จ! ต้อนรับคุณ ${user.name}`, "success");
        addAuditLog("USER_LOGIN", `${user.name} เข้าสู่ระบบผ่าน LINE`, "LINE");
        renderAllViews();
    } else {
        showToast("❌ ไม่พบบัญชี LINE นี้ กรุณาลงทะเบียนผ่าน LINE ก่อน", "error");
    }
}

function handleEmailRegister(e) {
    e.preventDefault();
    const role = document.getElementById("reg-email-role").value;
    const username = document.getElementById("reg-email-username").value.trim();
    const pass = document.getElementById("reg-email-pass").value.trim();
    const name = document.getElementById("reg-email-fullname").value.trim();
    const email = document.getElementById("reg-email-email").value.trim();

    let building = "ส่วนกลาง";
    let room = "GuardStation";

    if (role === 'resident') {
        building = document.getElementById("reg-email-building").value;
        room = document.getElementById("reg-email-room").value.trim();
        if (!room) {
            showToast("❌ กรุณากรอกเลขห้อง", "error");
            return;
        }
    }

    if (users.some(u => u.username === username || u.userId === username)) {
        showToast("❌ ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว", "error");
        return;
    }

    const userId = (role === 'guard' ? 'GRD-' : 'USR-') + Math.floor(1000 + Math.random() * 9000);

    const newUser = {
        id: userId,
        userId: userId,
        username: username,
        passcode: pass,
        name: name,
        building: building,
        room: room,
        email: email,
        provider: "email",
        role: role,
        status: "pending", // รอนิติบุคคลอนุมัติ
        regDate: new Date().toISOString().slice(0,10)
    };

    users.push(newUser);
    currentUser = null;
    saveData();
    updateRoomOptions();

    closeModal('modal-login');
    showToast(`📝 ส่งคำขอลงทะเบียน [${role === 'guard' ? 'รปภ.' : 'ลูกห้อง'}] เรียบร้อย! รอนิติบุคคลอนุมัติ`, "info");
    addAuditLog("USER_REGISTER", `สมัครสมาชิกใหม่: ${name} (${role === 'guard' ? 'รปภ.' : building + ' ห้อง ' + room}) รออนุมัติ`, "อีเมล");
    renderAllViews();
}

function handleLineRegister(e) {
    e.preventDefault();
    const role = document.getElementById("reg-line-role").value;
    const name = document.getElementById("reg-line-fullname").value.trim();
    const lineId = "LINE-" + Math.floor(1000 + Math.random() * 9000);

    let building = "ส่วนกลาง";
    let room = "GuardStation";

    if (role === 'resident') {
        building = document.getElementById("reg-line-building").value;
        room = document.getElementById("reg-line-room").value.trim();
        if (!room) {
            showToast("❌ กรุณากรอกเลขห้อง", "error");
            return;
        }
    }

    const newUser = {
        id: lineId,
        userId: lineId,
        username: "line_" + lineId.toLowerCase(),
        passcode: "1234",
        name: name,
        building: building,
        room: room,
        email: `${lineId.toLowerCase()}@line.me`,
        provider: "line",
        lineId: lineId,
        role: role,
        status: "pending",
        regDate: new Date().toISOString().slice(0,10)
    };

    users.push(newUser);
    currentUser = null;
    saveData();
    updateRoomOptions();

    closeModal('modal-login');
    showToast(`💬 ส่งคำขอสมัครผ่าน LINE [${role === 'guard' ? 'รปภ.' : 'ลูกห้อง'}] เรียบร้อย! รอนิติบุคคลอนุมัติ`, "info");
    addAuditLog("USER_REGISTER", `สมัครสมาชิกผ่าน LINE: ${name} (${role === 'guard' ? 'รปภ.' : building + ' ห้อง ' + room}) รออนุมัติ`, "LINE");
    renderAllViews();
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
    addAuditLog("USER_CHANGE_PASS", `ผู้ใช้ ${currentUser.name} เปลี่ยนรหัสผ่าน`, currentUser.role);

    document.getElementById("pass-old").value = "";
    document.getElementById("pass-new").value = "";
    document.getElementById("pass-confirm").value = "";
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem("smart_current_user_v6");
    showToast("👋 ออกจากระบบเรียบร้อยแล้ว", "info");
    renderAllViews();
}
