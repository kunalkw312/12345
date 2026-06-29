// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 1. FIREBASE SETUP
// ==========================================
let db = null;

try {
    // INSERT YOUR ACTUAL FIREBASE CONFIG HERE
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase Init Error: ", error);
}

// ==========================================
// 2. MAIN APP ROUTING (Public vs Admin)
// ==========================================
window.navigate = function(viewId) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    
    const target = document.getElementById(viewId);
    if(target) target.classList.add('active');

    const isAdminView = (viewId === 'admin-login-view' || viewId === 'admin-dashboard-view');
    document.getElementById('main-header').style.display = isAdminView ? 'none' : 'flex';
    document.getElementById('main-footer').style.display = isAdminView ? 'none' : 'block';
    
    if (viewId === 'admin-dashboard-view') {
        if (sessionStorage.getItem('adminAuth') !== 'true') {
            window.navigate('admin-login-view');
        } else {
            window.switchAdminTab('dash'); // Default admin tab
        }
    }
    
    if (viewId === 'public-leads-view') {
        window.loadPublicLeads();
    }
    
    window.scrollTo(0, 0);
};

// ==========================================
// 3. PUBLIC ACTIONS
// ==========================================

// Submit Contact Form (from Home or Contact Page)
window.submitContactForm = async function(e) {
    e.preventDefault();
    if (!db) return alert("Database not connected.");

    // Determine which form triggered this by checking inputs
    const isHome = e.target.querySelector('#home-name') !== null;
    const prefix = isHome ? 'home-' : 'contact-';

    const name = document.getElementById(prefix + 'name').value;
    const email = document.getElementById(prefix + 'email').value;
    const phone = document.getElementById(prefix + 'phone').value;
    const message = document.getElementById(prefix + 'msg').value;

    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Sending...";

    try {
        await addDoc(collection(db, "contact_submissions"), {
            name, email, phone, message,
            status: "NEW", // NEW, CONTACTED, IN_PROGRESS, CONVERTED, LOST
            timestamp: serverTimestamp()
        });
        alert("Your request has been submitted successfully!");
        e.target.reset();
    } catch (error) {
        console.error(error);
        alert("Error submitting. Please try again.");
    } finally {
        btn.innerText = originalText;
    }
};

// Load Published Leads for Public Site
window.loadPublicLeads = async function() {
    const grid = document.getElementById('public-leads-grid');
    if (!db) { grid.innerHTML = 'Database error.'; return; }

    try {
        const snap = await getDocs(collection(db, "published_leads"));
        if (snap.empty) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">No leads available currently.</div>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const data = doc.data();
            // Map category to a nice badge color
            const catColors = { "Finance": "badge-light-blue", "B2B": "badge-light-purple", "RenewableEnergy": "badge-light-green" };
            const badge = catColors[data.category] || "badge-light-yellow";
            
            html += `
                <div class="card">
                    <span class="badge ${badge}" style="margin-bottom:10px;">${data.category}</span>
                    <h3>${data.title}</h3>
                    <p style="font-size:14px; color:#64748b; margin-bottom:15px; line-height:1.5;">${data.description}</p>
                    <button class="btn-sm bg-blue" onclick="window.navigate('contact-view')">Inquire Now</button>
                </div>
            `;
        });
        grid.innerHTML = html;
    } catch (e) {
        console.error(e);
        grid.innerHTML = 'Error loading leads.';
    }
};

// ==========================================
// 4. ADMIN AUTHENTICATION
// ==========================================
window.checkLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById("admin-email").value;
    const pass = document.getElementById("admin-password").value;

    if (email === "admin@gmail.com" && pass === "1234") {
        sessionStorage.setItem('adminAuth', 'true');
        document.getElementById("admin-password").value = '';
        window.navigate('admin-dashboard-view');
    } else {
        alert("Invalid Credentials");
    }
};

window.logout = function() {
    sessionStorage.removeItem('adminAuth');
    window.navigate('admin-login-view');
};

// ==========================================
// 5. CRM PANEL ROUTING & LOGIC
// ==========================================
window.switchAdminTab = function(tabName) {
    // Update Sidebar CSS
    document.querySelectorAll('.crm-sidebar a').forEach(a => a.classList.remove('active'));
    document.getElementById(`nav-${tabName}`).classList.add('active');

    // Hide all tabs, show target
    const tabs = ['dash', 'leads', 'users', 'contactforms', 'reports'];
    tabs.forEach(t => document.getElementById(`tab-${t}`).classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    // Load Data based on tab
    if(tabName === 'dash') loadAdminDash();
    if(tabName === 'leads') loadAdminLeads();
    if(tabName === 'contactforms' || tabName === 'users') loadContactFormsAndKanban();
    if(tabName === 'reports') loadAdminReports();
};

// --- Modals ---
window.openAddLeadModal = () => document.getElementById('add-lead-modal').classList.remove('hidden');

// --- Tab 1: Dashboard Data ---
async function loadAdminDash() {
    if(!db) return;
    try {
        const snap = await getDocs(collection(db, "published_leads"));
        document.getElementById('dash-total').innerText = snap.size;
        document.getElementById('dash-active').innerText = snap.size; // Assuming all published are active
        document.getElementById('dash-new').innerText = 0; // Requires complex date logic, hardcoded for visual per screenshot
    } catch(e) { console.error(e); }
}

// --- Tab 2: Leads (Published) ---
window.submitNewLead = async function(e) {
    e.preventDefault();
    const title = document.getElementById('modal-title').value;
    const cat = document.getElementById('modal-cat').value;
    const desc = document.getElementById('modal-desc').value;

    try {
        await addDoc(collection(db, "published_leads"), {
            title, category: cat, description: desc, status: "Active", timestamp: serverTimestamp()
        });
        document.getElementById('add-lead-modal').classList.add('hidden');
        e.target.reset();
        loadAdminLeads(); // refresh
        loadAdminDash(); // refresh counts
    } catch (err) { alert("Error adding lead."); }
};

window.deletePublishedLead = async function(id) {
    if(!confirm("Delete this lead?")) return;
    await deleteDoc(doc(db, "published_leads", id));
    loadAdminLeads();
};

async function loadAdminLeads() {
    if(!db) return;
    const tbody = document.getElementById('admin-published-leads-table');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    
    try {
        const snap = await getDocs(collection(db, "published_leads"));
        document.getElementById('leads-tab-total-btn').innerText = `Total Leads: ${snap.size}`;
        let html = '';
        snap.forEach(d => {
            const data = d.data();
            const badgeColor = data.category === 'Finance' ? 'badge-light-blue' : (data.category==='B2B'?'badge-light-purple':'badge-light-green');
            
            html += `
            <tr>
                <td style="font-weight:600;">${data.title}</td>
                <td><span class="badge ${badgeColor}">${data.category}</span></td>
                <td><span class="badge badge-light-green">Active</span></td>
                <td>
                    <button class="btn-sm bg-yellow">Edit</button>
                    <button class="btn-sm bg-red" onclick="window.deletePublishedLead('${d.id}')">Delete</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="4">No leads published.</td></tr>';
    } catch(e) { tbody.innerHTML = '<tr><td colspan="4">Error</td></tr>'; }
}

// --- Tab 3 & 4: Users (Kanban) & Contact Forms ---
window.updateContactStatus = async function(id, newStatus) {
    await updateDoc(doc(db, "contact_submissions", id), { status: newStatus });
    loadContactFormsAndKanban(); // Refresh both views
};

window.deleteContactForm = async function(id) {
    if(!confirm("Delete submission?")) return;
    await deleteDoc(doc(db, "contact_submissions", id));
    loadContactFormsAndKanban();
};

async function loadContactFormsAndKanban() {
    if(!db) return;
    const tbody = document.getElementById('admin-contact-forms-table');
    
    // Clear Kanban
    const kb = { NEW: '', CONTACTED: '', IN_PROGRESS: '', CONVERTED: '', LOST: '' };

    try {
        const snap = await getDocs(collection(db, "contact_submissions"));
        let tableHtml = '';

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const s = data.status || "NEW";
            
            // Build Table Row
            let sBadge = s === 'NEW' ? 'badge-light-blue' : s === 'CONTACTED' ? 'badge-light-yellow' : s === 'IN_PROGRESS' ? 'badge-light-purple' : 'badge-light-green';
            if(s==='LOST') sBadge = 'badge-light-red';

            tableHtml += `
            <tr>
                <td style="font-weight:500;">${data.name}</td>
                <td>${data.email}</td>
                <td>${data.phone}</td>
                <td><div style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${data.message}</div></td>
                <td><span class="badge ${sBadge}">${s}</span></td>
                <td style="min-width: 250px;">
                    <button class="btn-sm bg-blue" onclick="window.updateContactStatus('${id}','CONTACTED')">Contacted</button>
                    <button class="btn-sm bg-purple" onclick="window.updateContactStatus('${id}','IN_PROGRESS')">In Progress</button>
                    <button class="btn-sm bg-green" onclick="window.updateContactStatus('${id}','CONVERTED')">Convert</button>
                    <button class="btn-sm bg-red" onclick="window.deleteContactForm('${id}')">Delete</button>
                </td>
            </tr>`;

            // Build Kanban Card
            if(kb[s] !== undefined) {
                kb[s] += `<div class="kanban-card">${data.name}</div>`;
            } else {
                kb['NEW'] += `<div class="kanban-card">${data.name}</div>`; // fallback
            }
        });

        tbody.innerHTML = tableHtml || '<tr><td colspan="6">No form submissions yet.</td></tr>';
        
        // Inject Kanban
        document.getElementById('kb-new').innerHTML = kb.NEW || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';
        document.getElementById('kb-contacted').innerHTML = kb.CONTACTED || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';
        document.getElementById('kb-inprogress').innerHTML = kb.IN_PROGRESS || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';
        document.getElementById('kb-converted').innerHTML = kb.CONVERTED || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';
        document.getElementById('kb-lost').innerHTML = kb.LOST || '<div style="color:#94a3b8; font-size:12px; text-align:center;">No Leads</div>';

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6">Error loading data.</td></tr>';
    }
}

// --- Tab 5: Reports ---
async function loadAdminReports() {
    if(!db) return;
    try {
        const snap = await getDocs(collection(db, "contact_submissions"));
        let active = 0, lost = 0, total = snap.size;
        
        snap.forEach(d => {
            const s = d.data().status;
            if(s === 'LOST') lost++;
            else active++; // NEW, CONTACTED, IN_PROGRESS, CONVERTED count as active pipeline
        });

        document.getElementById('rep-total').innerText = total;
        document.getElementById('rep-active').innerText = active;
        document.getElementById('rep-inactive').innerText = lost;

        // Animate basic CSS Chart
        setTimeout(() => {
            document.getElementById('chart-total').style.height = total > 0 ? '100%' : '10%';
            document.getElementById('chart-active').style.height = total > 0 ? `${(active/total)*100}%` : '10%';
            document.getElementById('chart-inactive').style.height = total > 0 ? `${(lost/total)*100}%` : '10%';
        }, 100);

    } catch (e) { console.error(e); }
}
