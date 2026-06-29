// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 01. FIREBASE ARCHITECTURE SETUP
// ==========================================
let db = null;

try {
    const firebaseConfig = {
        apiKey: "AIzaSyCuB2izaoYMfr-olS3ImYL7Vw1OqkhMR5U",
        authDomain: "qfy-leads-59c25.firebaseapp.com",
        databaseURL: "https://qfy-leads-59c25-default-rtdb.firebaseio.com",
        projectId: "qfy-leads-59c25",
        storageBucket: "qfy-leads-59c25.firebasestorage.app",
        messagingSenderId: "873319787899",
        appId: "1:873319787899:web:3285832f2b5cda967c21de",
        measurementId: "G-PQ108NT0YX"
    };

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase Initialization Error: ", error);
}

// Global State Management
let allPublishedLeads = [];
let currentCategoryFilter = 'All';

// ==========================================
// 02. CORE APPLICATION ROUTING (SPA Engine)
// ==========================================
window.navigate = function (viewId) {
    // Deactivate all views
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    
    // Activate target view
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    // Manage standard public header/footer visibility context
    const isAdminView = (viewId === 'admin-login-view' || viewId === 'admin-dashboard-view');
    const mainHeader = document.getElementById('main-header');
    const mainFooter = document.getElementById('main-footer');
    
    if (mainHeader) mainHeader.style.display = isAdminView ? 'none' : 'flex';
    if (mainFooter) mainFooter.style.display = isAdminView ? 'none' : 'block';

    // Route access intercept loops
    if (viewId === 'admin-dashboard-view') {
        if (sessionStorage.getItem('adminAuth') !== 'true') {
            window.navigate('admin-login-view');
        } else {
            window.switchAdminTab('dash');
        }
    }

    if (viewId === 'public-leads-view') {
        window.loadPublicLeads();
    }
    
    // Smooth reset scroll layout orientation
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==========================================
// 03. PUBLIC VIEW CLIENT ACTIONS & LEAD PROCESSING
// ==========================================
window.submitContactForm = async function (e) {
    e.preventDefault();
    if (!db) return alert("Database connection error. Please verify configuration.");

    const form = e.target;
    
    // Multi-tier structural selectors safeguard form read operations
    const name = form.name?.value || form.querySelector('input[type="text"], input[placeholder*="Name"]')?.value || '';
    const email = form.email?.value || form.querySelector('input[type="email"], input[placeholder*="Email"]')?.value || '';
    const phone = form.phone?.value || form.querySelector('input[type="tel"], input[placeholder*="Phone"]')?.value || '';
    const message = form.message?.value || form.querySelector('textarea')?.value || '';

    const btn = form.querySelector('button');
    const originalText = btn ? btn.innerText : "Send Message";
    if (btn) btn.innerText = "Sending...";

    try {
        await addDoc(collection(db, "contact_submissions"), {
            name, email, phone, message,
            status: "NEW",
            timestamp: serverTimestamp()
        });
        alert("Your inquiry has been submitted successfully!");
        form.reset();
    } catch (error) {
        console.error("Firestore Document Transmission Error:", error);
        alert("Failed to submit request. Check database rule parameters.");
    } finally {
        if (btn) btn.innerText = originalText;
    }
};

window.loadPublicLeads = async function () {
    const grid = document.getElementById('public-leads-grid');
    if (!grid) return;
    
    if (!db) { 
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Database connectivity failure. Check settings.</div>'; 
        return; 
    }

    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; font-weight:500; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="margin-right:10px;"></i>Loading active verified leads...</div>';

    try {
        const snap = await getDocs(collection(db, "published_leads"));
        allPublishedLeads = [];

        snap.forEach(doc => {
            allPublishedLeads.push(doc.data());
        });

        window.filterPublicLeads(); 

    } catch (e) {
        console.error("Firestore Document Read Sequence Interrupted:", e);
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Error loading leads cache framework.</div>';
    }
};

// Category Pill Handler Engine
window.setLeadFilter = function (category) {
    currentCategoryFilter = category;

    // Synchronize current filter node component tokens
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if (btn.innerText.trim() === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    window.filterPublicLeads();
};

// Lead Filtering Pipeline Rendering Matrix
window.filterPublicLeads = function () {
    const grid = document.getElementById('public-leads-grid');
    if (!grid) return;

    const searchInput = document.getElementById('lead-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    let filteredLeads = allPublishedLeads.filter(lead => {
        const matchesCategory = currentCategoryFilter === 'All' || lead.category === currentCategoryFilter;
        const matchesSearch = (lead.title?.toLowerCase().includes(searchTerm) || 
                             lead.description?.toLowerCase().includes(searchTerm) || 
                             lead.category?.toLowerCase().includes(searchTerm));

        return matchesCategory && matchesSearch;
    });

    // Update Layout Tracking Summaries Counter
    const summary = document.getElementById('lead-results-summary');
    if (summary) {
        summary.innerText = currentCategoryFilter === 'All'
            ? `Showing ${filteredLeads.length} total leads`
            : `Showing ${filteredLeads.length} leads in ${currentCategoryFilter}`;
    }

    if (filteredLeads.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--text-muted); font-size:16px;">No leads match your matching criteria profile configurations.</div>';
        return;
    }

    let html = '';
    filteredLeads.forEach(data => {
        // Evaluate appropriate context graphic classes
        let iconClass = "fa-briefcase";
        if (data.category === "Insurance") iconClass = "fa-shield-halved";
        if (data.category === "Finance") iconClass = "fa-dollar-sign";
        if (data.category === "Legal") iconClass = "fa-scale-balanced";
        if (data.category === "Healthcare") iconClass = "fa-heart-pulse";
        if (data.category === "RenewableEnergy") iconClass = "fa-leaf";
        if (data.category === "IT") iconClass = "fa-laptop-code";

        html += `
            <div class="lead-card-new" style="background:var(--white); padding:30px; border-radius:var(--radius-md); box-shadow:var(--shadow-sm); display:flex; gap:20px; transition:var(--transition); border:1px solid #f0f4f9;">
                <div class="lead-icon" style="width:55px; height:55px; background:var(--bg-light); border-radius:50%; display:flex; justify-content:center; align-items:center; color:var(--accent-dark); font-size:22px; flex-shrink:0;">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div class="lead-details" style="flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                    <div style="margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                            <h4 style="font-size:18px; font-weight:700; color:var(--primary); line-height:1.4;">${data.title}</h4>
                            <span class="badge" style="background:#e0f2fe; color:var(--primary-light); padding:5px 12px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap;">${data.category}</span>
                        </div>
                        <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin-bottom:15px;">${data.description}</p>
                    </div>
                    <button class="btn-view" onclick="window.navigate('contact-view')" style="align-self:flex-start; background:none; border:none; color:var(--accent-dark); font-weight:700; font-size:14px; cursor:pointer; padding:0; display:flex; align-items:center; gap:5px; transition:var(--transition);">
                        View Details <i class="fa-solid fa-arrow-right" style="font-size:12px;"></i>
                    </button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
};

// ==========================================
// 04. SECURE ADMIN PORTAL AUTHENTICATION
// ==========================================
window.checkLogin = function (e) {
    e.preventDefault();
    const email = document.getElementById("admin-email")?.value;
    const pass = document.getElementById("admin-password")?.value;

    if (email === "admin@gmail.com" && pass === "1234") {
        sessionStorage.setItem('adminAuth', 'true');
        if (document.getElementById("admin-password")) {
            document.getElementById("admin-password").value = '';
        }
        window.navigate('admin-dashboard-view');
    } else {
        alert("Invalid Access Credentials Configuration");
    }
};

window.logout = function () {
    sessionStorage.removeItem('adminAuth');
    window.navigate('admin-login-view');
};

// ==========================================
// 05. PRIVATE SYSTEM CRM CONTROL PANEL ENGINE
// ==========================================
window.switchAdminTab = function (tabName) {
    document.querySelectorAll('.crm-sidebar a').forEach(a => a.classList.remove('active'));
    const targetedNavLink = document.getElementById(`nav-${tabName}`);
    if (targetedNavLink) targetedNavLink.classList.add('active');

    const tabs = ['dash', 'leads', 'users', 'contactforms', 'reports'];
    tabs.forEach(t => {
        const tabEl = document.getElementById(`tab-${t}`);
        if (tabEl) tabEl.classList.add('hidden');
    });
    
    const targetedTabWindow = document.getElementById(`tab-${tabName}`);
    if (targetedTabWindow) targetedTabWindow.classList.remove('hidden');

    if (tabName === 'dash') loadAdminDash();
    if (tabName === 'leads') loadAdminLeads();
    if (tabName === 'contactforms' || tabName === 'users') loadContactFormsAndKanban();
    if (tabName === 'reports') loadAdminReports();
};

window.openAddLeadModal = () => {
    const modal = document.getElementById('add-lead-modal');
    if (modal) modal.classList.remove('hidden');
};

// --- Tab Module 1: Core Dashboard Operational Metrics ---
async function loadAdminDash() {
    if (!db) return;
    try {
        const snap = await getDocs(collection(db, "published_leads"));
        const dashTotal = document.getElementById('dash-total');
        const dashActive = document.getElementById('dash-active');
        const dashNew = document.getElementById('dash-new');
        
        if (dashTotal) dashTotal.innerText = snap.size;
        if (dashActive) dashActive.innerText = snap.size;
        if (dashNew) dashNew.innerText = 0;
    } catch (e) { 
        console.error("Dashboard metric resolution failed:", e); 
    }
}

// --- Tab Module 2: Published CRM Leads Processing Matrix ---
window.submitNewLead = async function (e) {
    e.preventDefault();
    const title = document.getElementById('modal-title')?.value;
    const cat = document.getElementById('modal-cat')?.value;
    const desc = document.getElementById('modal-desc')?.value;

    try {
        await addDoc(collection(db, "published_leads"), {
            title, category: cat, description: desc, status: "Active", timestamp: serverTimestamp()
        });
        const modal = document.getElementById('add-lead-modal');
        if (modal) modal.classList.add('hidden');
        
        e.target.reset();
        loadAdminLeads();
        loadAdminDash();
    } catch (err) { 
        console.error("Error committing dynamic item framework creation logic:", err); 
        alert("Failed to write lead document configuration parameters."); 
    }
};

window.deletePublishedLead = async function (id) {
    if (!confirm("Are you sure you want to permanently delete this lead mapping?")) return;
    try {
        await deleteDoc(doc(db, "published_leads", id));
        loadAdminLeads();
    } catch (err) {
        console.error("Delete operation baseline dropped:", err);
    }
};

async function loadAdminLeads() {
    if (!db) return;
    const tbody = document.getElementById('admin-published-leads-table');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">Syncing secure dynamic payload rows...</td></tr>';

    try {
        const snap = await getDocs(collection(db, "published_leads"));
        const leadTotalBtn = document.getElementById('leads-tab-total-btn');
        if (leadTotalBtn) leadTotalBtn.innerText = `Total Leads: ${snap.size}`;
        
        let html = '';
        snap.forEach(d => {
            const data = d.data();
            const badgeColor = data.category === 'Finance' ? 'badge-light-blue' : (data.category === 'B2B' ? 'badge-light-purple' : 'badge-light-green');

            html += `
            <tr style="border-bottom:1px solid #edf2f7;">
                <td style="padding:16px; font-weight:600; color:var(--primary);">${data.title}</td>
                <td style="padding:16px;"><span class="badge ${badgeColor}" style="padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600;">${data.category}</span></td>
                <td style="padding:16px;"><span class="badge badge-light-green" style="background:#e6f4ea; color:#137333; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600;">Active</span></td>
                <td style="padding:16px;">
                    <button class="btn-sm bg-red" onclick="window.deletePublishedLead('${d.id}')" style="background:#dc2626; color:var(--white); border:none; padding:6px 14px; border-radius:var(--radius-sm); font-weight:600; font-size:12px; cursor:pointer; transition:var(--transition);">Delete</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No active leads cataloged inside index arrays.</td></tr>';
    } catch (e) { 
        console.error(e); 
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:red;">System layout stream index mismatch configuration failure.</td></tr>'; 
    }
}

// --- Tab Modules 3 & 4: Contacts Management & Interactive Kanban Framework ---
window.updateContactStatus = async function (id, newStatus) {
    try {
        await updateDoc(doc(db, "contact_submissions", id), { status: newStatus });
        loadContactFormsAndKanban();
    } catch (err) {
        console.error("Status state mutation rejected:", err);
    }
};

window.deleteContactForm = async function (id) {
    if (!confirm("Permanently drop data transmission submission record?")) return;
    try {
        await deleteDoc(doc(db, "contact_submissions", id));
        loadContactFormsAndKanban();
    } catch (err) {
        console.error("Record purge failed:", err);
    }
};

async function loadContactFormsAndKanban() {
    if (!db) return;
    const tbody = document.getElementById('admin-contact-forms-table');
    if (!tbody) return;
    
    const kb = { NEW: '', CONTACTED: '', IN_PROGRESS: '', CONVERTED: '', LOST: '' };

    try {
        const snap = await getDocs(collection(db, "contact_submissions"));
        let tableHtml = '';

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const s = data.status || "NEW";

            let sBadge = 'badge-light-blue';
            if (s === 'CONTACTED') sBadge = 'badge-light-yellow';
            if (s === 'IN_PROGRESS') sBadge = 'badge-light-purple';
            if (s === 'CONVERTED') sBadge = 'badge-light-green';
            if (s === 'LOST') sBadge = 'badge-light-red';

            tableHtml += `
            <tr style="border-bottom:1px solid #edf2f7;">
                <td style="padding:16px; font-weight:600; color:var(--primary);">${data.name}</td>
                <td style="padding:16px; font-size:14px;">${data.email}</td>
                <td style="padding:16px; font-size:14px;">${data.phone}</td>
                <td style="padding:16px;"><div style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; color:var(--text-muted);">${data.message}</div></td>
                <td style="padding:16px;"><span class="badge ${sBadge}" style="padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600;">${s}</span></td>
                <td style="padding:16px; min-width:260px; display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn-sm bg-blue" onclick="window.updateContactStatus('${id}','CONTACTED')" style="background:#2563eb; color:var(--white); border:none; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">Contact</button>
                    <button class="btn-sm bg-purple" onclick="window.updateContactStatus('${id}','IN_PROGRESS')" style="background:#7c3aed; color:var(--white); border:none; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">Progress</button>
                    <button class="btn-sm bg-green" onclick="window.updateContactStatus('${id}','CONVERTED')" style="background:#16a34a; color:var(--white); border:none; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">Convert</button>
                    <button class="btn-sm bg-red" onclick="window.updateContactStatus('${id}','LOST')" style="background:#dc2626; color:var(--white); border:none; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">Lost</button>
                </td>
            </tr>`;

            const cardMarkup = `<div class="kanban-card" style="background:var(--white); padding:14px; border-radius:var(--radius-sm); box-shadow:var(--shadow-sm); margin-bottom:10px; border-left:4px solid var(--primary-light); font-weight:600; font-size:13px; color:var(--primary);">${data.name}</div>`;
            if (kb[s] !== undefined) {
                kb[s] += cardMarkup;
            } else {
                kb['NEW'] += cardMarkup;
            }
        });

        tbody.innerHTML = tableHtml || '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">No request logs cataloged inside the target databases.</td></tr>';

        // Load visual structural frames interface for Kanban streams
        const kbNew = document.getElementById('kb-new');
        const kbContacted = document.getElementById('kb-contacted');
        const kbInProgress = document.getElementById('kb-inprogress');
        const kbConverted = document.getElementById('kb-converted');
        const kbLost = document.getElementById('kb-lost');

        if (kbNew) kbNew.innerHTML = kb.NEW || '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:10px;">No Leads</div>';
        if (kbContacted) kbContacted.innerHTML = kb.CONTACTED || '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:10px;">No Leads</div>';
        if (kbInProgress) kbInProgress.innerHTML = kb.IN_PROGRESS || '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:10px;">No Leads</div>';
        if (kbConverted) kbConverted.innerHTML = kb.CONVERTED || '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:10px;">No Leads</div>';
        if (kbLost) kbLost.innerHTML = kb.LOST || '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:10px;">No Leads</div>';

    } catch (e) {
        console.error("Data synchronization pipeline dropped:", e);
        tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center; padding:20px;">Secure runtime handshake timeout error.</td></tr>';
    }
}

// --- Tab Module 5: Secure Graphical Statistical Analytical Reports ---
async function loadAdminReports() {
    if (!db) return;
    try {
        const snap = await getDocs(collection(db, "contact_submissions"));
        let active = 0, lost = 0, total = snap.size;

        snap.forEach(d => {
            const s = d.data().status;
            if (s === 'LOST') lost++;
            else active++;
        });

        const repTotal = document.getElementById('rep-total');
        const repActive = document.getElementById('rep-active');
        const repInactive = document.getElementById('rep-inactive');

        if (repTotal) repTotal.innerText = total;
        if (repActive) repActive.innerText = active;
        if (repInactive) repInactive.innerText = lost;

        // Render graphical matrix height properties asynchronously
        setTimeout(() => {
            const chartTotal = document.getElementById('chart-total');
            const chartActive = document.getElementById('chart-active');
            const chartInactive = document.getElementById('chart-inactive');

            if (chartTotal) chartTotal.style.height = total > 0 ? '100%' : '10%';
            if (chartActive) chartActive.style.height = total > 0 ? `${(active / total) * 100}%` : '10%';
            if (chartInactive) chartInactive.style.height = total > 0 ? `${(lost / total) * 100}%` : '10%';
        }, 100);

    } catch (e) { 
        console.error("Reporting algorithm interface evaluation broken:", e); 
    }
}
