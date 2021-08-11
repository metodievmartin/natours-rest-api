import '@babel/polyfill';

import { displayMap } from "./mapbox.js";
import { login, logout } from "./login.js";
import { updateData } from "./updateSettings.js";
import { bookTour } from './stripe.js';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const logOutBtn = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');

if (mapBox){
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        login(email, password);
    });
}

if (logOutBtn) {
    logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
    userDataForm.addEventListener('submit', async e => {
       e.preventDefault();

        const saveBtn = document.querySelector('.btn--save--data');
        saveBtn.textContent = 'Updating...';
        saveBtn.disabled = true;

        const form = new FormData();
        form.append('name', document.getElementById('name').value)
        form.append('email', document.getElementById('email').value)
        form.append('photo', document.getElementById('photo').files[0])

        await updateData(form);

        saveBtn.textContent = 'Save settings';
        saveBtn.disabled = false
    });
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();

        const saveBtn = document.querySelector('.btn--save--password');
        saveBtn.textContent = 'Updating...';
        saveBtn.disabled = true;

        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        await updateData({ passwordCurrent, password, passwordConfirm }, true);

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';

        saveBtn.textContent = 'Save password';
        saveBtn.disabled = false;
    });
}

if (bookBtn) {
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    });
}