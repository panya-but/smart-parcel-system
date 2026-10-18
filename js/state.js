const INITIAL_USERS = [
    { id: "ADM-001", userId: "admin", username: "admin", passcode: "1234", name: "ผู้ดูแลระบบ (นิติบุคคล)", building: "ส่วนกลาง", room: "Admin Office", email: "admin@condo.com", provider: "email", role: "admin", status: "approved", regDate: "2024-01-01" },
    { id: "GRD-001", userId: "guard01", username: "guard01", passcode: "1234", name: "นายสมศักดิ์ (รปภ.กะเช้า)", building: "ส่วนกลาง", room: "GuardStation", email: "guard@condo.com", provider: "email", role: "guard", status: "approved", regDate: "2024-01-01" },
    { id: "USR-1001", userId: "1001", username: "somchai", passcode: "1234", name: "คุณสมชาย ใจดี", building: "ตึก A", room: "101", email: "somchai@email.com", provider: "email", role: "resident", status: "approved", regDate: "2024-01-02" },
    { id: "USR-1002", userId: "1002", username: "wipawan", passcode: "1234", name: "คุณวิภาวรรณ สุขเสริฐ", building: "ตึก A", room: "102", email: "wipawan@email.com", provider: "email", role: "resident", status: "approved", regDate: "2024-01-03" },
    { id: "USR-1003", userId: "1003", username: "piti_pending", passcode: "1234", name: "คุณปิติ สุขใจ (รออนุมัติ)", building: "ตึก B", room: "202", email: "piti@email.com", provider: "email", role: "resident", status: "pending", regDate: "2024-01-05" }
];

let users = [];
let parcels = [];
let auditLogs = [];
let currentUser = null;
let intakeUploadedPhotos = {};

const MOCK_BOX_PHOTO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%233b82f6'/><text x='50%' y='45%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%23ffffff' font-weight='bold'>📦 พัสดุอัจฉริยะ</text><text x='50%' y='65%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%23dbeafe'>Sample Parcel Photo</text></svg>";

function loadData() {
    try {
        const savedUsers = localStorage.getItem("smart_users_v6");
        if (savedUsers) users = JSON.parse(savedUsers);
        else users = [...INITIAL_USERS];

        const savedParcels = localStorage.getItem("smart_parcels_v6");
        if (savedParcels) parcels = JSON.parse(savedParcels);
        else parcels = getSampleInitialParcels();

        const savedLogs = localStorage.getItem("smart_audit_logs_v6");
        if (savedLogs) auditLogs = JSON.parse(savedLogs);
        else auditLogs = [{ id: Date.now(), action: "SYSTEM_INIT", details: "เริ่มต้นใช้งานระบบจัดการพัสดุ", by: "System", time: new Date().toLocaleString("th-TH") }];

        const savedCurrent = sessionStorage.getItem("smart_current_user_v6");
        if (savedCurrent) {
            const parsed = JSON.parse(savedCurrent);
            const exists = users.find(u => u.id === parsed.id && u.status === 'approved');
            currentUser = exists || null;
        } else {
            currentUser = null;
        }
    } catch(e) {
        users = [...INITIAL_USERS];
        parcels = getSampleInitialParcels();
        auditLogs = [];
        currentUser = null;
    }
}

function saveData() {
    try {
        localStorage.setItem("smart_users_v6", JSON.stringify(users));
        localStorage.setItem("smart_parcels_v6", JSON.stringify(parcels));
        localStorage.setItem("smart_audit_logs_v6", JSON.stringify(auditLogs));
        if (currentUser) {
            sessionStorage.setItem("smart_current_user_v6", JSON.stringify(currentUser));
        } else {
            sessionStorage.removeItem("smart_current_user_v6");
        }
    } catch(e) {
        console.warn("Storage quota handling active.", e);
    }
}

function getSampleInitialParcels() {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,16);
    return [
        {
            id: "PK-1001", building: "ตึก A", room: "101", datetime: yesterday, note: "กล่อง Shopee", overallStatus: "pending",
            items: [
                { no: 1, photo: MOCK_BOX_PHOTO, status: "pending" },
                { no: 2, photo: MOCK_BOX_PHOTO, status: "pending" }
            ]
        }
    ];
}

function setupDefaultDatetime() {
    const el = document.getElementById("intake-datetime");
    if (el) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        el.value = now.toISOString().slice(0,16);
    }
}
