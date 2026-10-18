const INITIAL_USERS = [
    { id: "USR-1001", userId: "1001", username: "somchai", passcode: "1234", name: "คุณสมชาย ใจดี", building: "ตึก A", room: "101", email: "somchai@email.com", provider: "email", role: "resident" },
    { id: "USR-1002", userId: "1002", username: "wipawan", passcode: "1234", name: "คุณวิภาวรรณ สุขเสริฐ", building: "ตึก A", room: "102", email: "wipawan@email.com", provider: "email", role: "resident" },
    { id: "LINE-8801", userId: "LINE-8801", username: "line_nattapol", passcode: "1234", name: "คุณณัฐพล พร้อมพงษ์", building: "ตึก B", room: "201", email: "nattapol@line.me", provider: "line", lineId: "LINE-8801", role: "resident" }
];

let users = [];
let parcels = [];
let auditLogs = [];
let currentUser = null;
let intakeUploadedPhotos = {};

const MOCK_BOX_PHOTO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%233b82f6'/><text x='50%' y='45%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%23ffffff' font-weight='bold'>📦 พัสดุอัจฉริยะ</text><text x='50%' y='65%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%23dbeafe'>Sample Parcel Photo</text></svg>";

function loadData() {
    try {
        const savedUsers = localStorage.getItem("smart_users_v4");
        if (savedUsers) users = JSON.parse(savedUsers);
        else users = [...INITIAL_USERS];

        const savedParcels = localStorage.getItem("smart_parcels_v3");
        if (savedParcels) parcels = JSON.parse(savedParcels);
        else parcels = getSampleInitialParcels();

        const savedLogs = localStorage.getItem("smart_audit_logs_v3");
        if (savedLogs) auditLogs = JSON.parse(savedLogs);
        else auditLogs = [{ id: Date.now(), action: "SYSTEM_INIT", details: "เริ่มต้นใช้งานระบบจัดการพัสดุ", by: "System", time: new Date().toLocaleString("th-TH") }];
    } catch(e) {
        users = [...INITIAL_USERS];
        parcels = getSampleInitialParcels();
        auditLogs = [];
    }

    if (!currentUser) {
        currentUser = users[0]; // กำหนดผู้ใช้เริ่มต้น
    }
}

function saveData() {
    try {
        localStorage.setItem("smart_users_v4", JSON.stringify(users));
        localStorage.setItem("smart_parcels_v3", JSON.stringify(parcels));
        localStorage.setItem("smart_audit_logs_v3", JSON.stringify(auditLogs));
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