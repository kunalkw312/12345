// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 1. GLOBAL UI & ROUTING LOGIC
// (Registered immediately so buttons always work)
// ==========================================

window.navigate = function(viewId) {
    // Hide all views
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show target view
    const targetView = document.getElementById(viewId);
    if(targetView) {
        targetView.classList.add('active');
    }

    // Hide header/footer if it's an admin view
    const isAdminView = viewId === 'admin-login-view' || viewId === 'admin-dashboard-view';
    const mainHeader = document.getElementById('main-header');
    const mainFooter = document.getElementById('main-footer');
    
    if (mainHeader) mainHeader.style.display = isAdminView ? 'none' : 'flex';
    if (mainFooter) mainFooter.style.display = isAdminView ? 'none' : 'block';
    
    // Authentication Check for Dashboard
    if (viewId === 'admin-dashboard-view') {
        if (sessionStorage.getItem('adminAuth') !== 'true') {
            window.navigate('admin-login-view');
        } else {
            window.loadDashboardData();
        }
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
};

window.toggleFaq = function(element) {
    const item = element.parentElement;
    item.classList.toggle('open');
};

window.showCategory = function(event, category) {
    if (event && event.target) {
        const buttons = document.querySelectorAll('.faq-sidebar button');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }

    const container = document.getElementById('faqContainer');
    if (!container) return;
    
    container.innerHTML = '';

    let faqs = [];
    if(category === 'General'){
        faqs = [
            {q:'What is Qfy Leads?',a:'Qfy Leads is a premium lead generation company that provides high‑intent, verified and conversion‑ready leads.'},
            {q:'How does Qfy Leads work?',a:'We run data‑driven marketing campaigns, verify leads through compliance checks, and deliver them directly to your team.'},
            {q:'Which industries do you serve?',a:'We specialize in Insurance, Healthcare, Financial Services, Real Estate, and Home Services.'}
        ];
    } else if(category === 'Leads'){
        faqs = [
            {q:'Do you offer replacements for invalid leads?',a:'Yes, we provide replacement or credit for invalid leads strictly according to our service agreement.'},
            {q:'Can I customize targeting filters?',a:'Absolutely. We offer geo‑location, demographic, intent‑based, and industry‑specific targeting options.'}
        ];
    } else if(category === 'Technical'){
        faqs = [
            {q:'Do you offer CRM integration?',a:'Yes. We support direct CRM integrations and API‑based delivery for seamless automation.'},
            {q:'Is my data secure?',a:'Yes. We follow strict data security protocols and compliance standards to ensure all data remains protected.'}
        ];
    } else if(category === 'Pricing'){
        faqs = [
            {q:'How is pricing structured?',a:'Pricing depends on your industry, targeting filters, required volume, and delivery type. Reach out for a custom quote.'}
        ];
    }

    faqs.forEach(faq => {
        const item = document.createElement('div');
        item.className = 'faq-item';
        item.innerHTML = `
            <div class="faq-question" onclick="window.toggleFaq(this)">${faq.q} <span style="font-size:12px; color:#1c4d8d;">▼</span></div>
            <div class="faq-answer">${faq.a}</div>
        `;
        container.appendChild(item);
    });
};

window.checkLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;

    // Hardcoded credentials
    if (email === "admin@gmail.com" && password === "1234") {
        sessionStorage.setItem('adminAuth', 'true');
        document.getElementById("admin-password").value = ''; // clear password field
        window.navigate('admin-dashboard-view');
    } else {
        alert("Invalid Email or Password ❌");
    }
};

window.logout = function() {
    sessionStorage.removeItem('adminAuth');
    window.navigate('admin-login-view');
};

// Default load logic
document.addEventListener('DOMContentLoaded', () => {
    window.showCategory(null, 'General'); // Load initial FAQs
});


// ==========================================
// 2. FIREBASE CONFIGURATION & LOGIC
// (Wrapped safely so it won't crash the UI if keys are missing)
// ==========================================

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let db = null;

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.warn("Firebase could not initialize. Make sure you updated your config keys in app.js.", error);
}

// Function to handle form submissions
async function handleContactSubmit(e) {
    e.preventDefault();
    
    if (!db) {
        alert("Database is not connected. Please update your Firebase Config keys in app.js.");
        return;
    }

    const form = e.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const phone = form.querySelector('input[type="tel"]').value;
    const message = form.querySelector('textarea').value;

    const btn = form.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Sending...";

    try {
        await addDoc(collection(db, "leads"), {
            name: name,
            email: email,
            phone: phone,
            message: message,
            timestamp: serverTimestamp(),
            status: "New"
        });
        alert("Thank you! Your message has been sent successfully.");
        form.reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Error sending message. Please try again.");
    } finally {
        btn.innerText = originalText;
    }
}

// Attach listener to all contact forms
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lead-form').forEach(form => {
        form.addEventListener('submit', handleContactSubmit);
    });
});

// Function to fetch data for the Admin CRM
window.loadDashboardData = async function() {
    const leadsContainer = document.getElementById('leads-table-body');
    leadsContainer.innerHTML = '<tr><td colspan="5" style="padding: 15px; text-align:center;">Loading leads securely from database...</td></tr>';
    
    if (!db) {
        leadsContainer.innerHTML = '<tr><td colspan="5" style="padding: 15px; text-align:center; color: red;">Database not connected. Check Firebase Config.</td></tr>';
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "leads"));
        let html = '';
        let count = 0;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'Just now';
            count++;
            
            html += `
                <tr style="border-bottom: 1px solid #eee; background: #fff;">
                    <td style="padding: 12px; color: #555;">${data.name}</td>
                    <td style="padding: 12px; color: #555;">${data.email}</td>
                    <td style="padding: 12px; color: #555;">${data.phone}</td>
                    <td style="padding: 12px; color: #555;">${data.message}</td>
                    <td style="padding: 12px; color: #555;">${date}</td>
                </tr>
            `;
        });
        
        leadsContainer.innerHTML = html || '<tr><td colspan="5" style="padding: 15px; text-align:center;">No leads found in database.</td></tr>';
        document.getElementById('total-leads-count').innerText = count;
        document.getElementById('new-today-count').innerText = count; 
        
    } catch (error) {
        console.error("Error fetching leads: ", error);
        leadsContainer.innerHTML = '<tr><td colspan="5" style="padding: 15px; text-align:center; color: red;">Error loading data. Check console.</td></tr>';
    }
};
