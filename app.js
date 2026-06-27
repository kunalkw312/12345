// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- NAVIGATION LOGIC ---
window.navigate = function(viewId) {
    // Hide all views
    document.querySelectorAll('.page-view').forEach(view => {
        view.style.display = 'none';
    });
    
    // Show target view
    document.getElementById(viewId).style.display = 'block';

    // Hide header/footer if it's an admin view
    const isAdminView = viewId === 'admin-login-view' || viewId === 'admin-dashboard-view';
    document.getElementById('main-header').style.display = isAdminView ? 'none' : 'flex';
    document.getElementById('main-footer').style.display = isAdminView ? 'none' : 'block';
    
    // If navigating to dashboard, check auth and load data
    if (viewId === 'admin-dashboard-view') {
        if (sessionStorage.getItem('adminAuth') !== 'true') {
            navigate('admin-login-view');
        } else {
            loadDashboardData();
        }
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
};

// --- CONTACT FORM LOGIC (LEAD CAPTURE) ---
async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Get values based on form structure
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const phone = form.querySelector('input[type="tel"]').value;
    const message = form.querySelector('textarea').value;

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
    }
}

// Attach listener to all forms with the class 'lead-form'
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lead-form').forEach(form => {
        form.addEventListener('submit', handleContactSubmit);
    });
    
    // Default route
    navigate('home-view');
});

// --- ADMIN AUTH LOGIC ---
window.checkLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;

    // Hardcoded credentials as requested
    if (email === "admin@gmail.com" && password === "1234") {
        sessionStorage.setItem('adminAuth', 'true');
        alert("Login Successful ✅");
        navigate('admin-dashboard-view');
    } else {
        alert("Invalid Email or Password ❌");
    }
}

window.logout = function() {
    sessionStorage.removeItem('adminAuth');
    navigate('admin-login-view');
}

// --- ADMIN DASHBOARD LOGIC (CRM) ---
async function loadDashboardData() {
    const leadsContainer = document.getElementById('leads-table-body');
    leadsContainer.innerHTML = '<tr><td colspan="5">Loading leads...</td></tr>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "leads"));
        let html = '';
        let count = 0;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'Just now';
            count++;
            
            html += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.email}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.phone}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.message}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${date}</td>
                </tr>
            `;
        });
        
        leadsContainer.innerHTML = html || '<tr><td colspan="5">No leads found.</td></tr>';
        document.getElementById('total-leads-count').innerText = count;
        document.getElementById('new-today-count').innerText = count; // Simplified for this implementation
        
    } catch (error) {
        console.error("Error fetching leads: ", error);
        leadsContainer.innerHTML = '<tr><td colspan="5">Error loading data. Check console.</td></tr>';
    }
}

// Expose internal functions for inline HTML event handlers
window.toggleFaq = function(element) {
    // Handling the FAQ page toggles
    if(element.tagName === 'BUTTON') { // Used in About Page
        const box = document.getElementById('faqBox');
        const icon = document.getElementById('toggleIcon');
        box.classList.toggle('open');
        icon.textContent = box.classList.contains('open') ? '−' : '+';
    } else { // Used in FAQ page
        const item = element.parentElement;
        item.classList.toggle('open');
    }
}

window.showCategory = function(category) {
    const buttons = document.querySelectorAll('.faq-sidebar button');
    buttons.forEach(btn=>btn.classList.remove('active'));
    event.target.classList.add('active');

    const container = document.getElementById('faqContainer');
    container.innerHTML = '';

    let faqs = [];
    if(category==='General'){
        faqs = [
            {q:'What is Qfy Leads?',a:'Qfy Leads is a premium lead generation company that provides high‑intent, verified and conversion‑ready leads.'},
            {q:'How does Qfy Leads work?',a:'We run data‑driven marketing campaigns, verify leads through compliance checks, and deliver them.'},
            {q:'Which industries do you serve?',a:'We serve Insurance, Healthcare, Financial Services, Real Estate, Home Services, and more.'}
        ];
    } else if(category==='Leads'){
        faqs = [
            {q:'Do you offer replacement for invalid leads?',a:'We provide replacement or credit for invalid leads according to our service agreement.'},
            {q:'Can I customize targeting filters?',a:'Absolutely. We offer geo‑location, demographic, device, intent‑based and industry‑specific targeting options.'}
        ];
    } else if(category==='Technical'){
        faqs = [
            {q:'Do you offer CRM integration?',a:'Yes. We support CRM integrations and API‑based delivery for seamless automation.'},
            {q:'How are leads delivered?',a:'Leads can be delivered via API, CRM integration, email, or secure dashboard access.'},
            {q:'Is my data secure?',a:'Yes. We follow strict data security protocols and compliance standards.'}
        ];
    } else if(category==='Pricing'){
        faqs = [
            {q:'How is pricing structured?',a:'Pricing depends on industry, targeting filters, volume, and delivery type.'},
            {q:'Is there a minimum order requirement?',a:'Minimum order volume varies by industry. Our team will guide you based on your campaign goals.'}
        ];
    }

    faqs.forEach(faq=>{
        const item = document.createElement('div');
        item.className = 'faq-item';
        item.innerHTML = `
            <div class="faq-question" onclick="toggleFaq(this)">${faq.q}</div>
            <div class="faq-answer">${faq.a}</div>
        `;
        container.appendChild(item);
    });
}
