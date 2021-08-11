export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) {
        el.parentElement.removeChild(el);
    }
};

// type is 'success' or 'error'
export const showAlert = (type, msg) => {
    hideAlert();

    const markup = document.createElement('div');
    markup.className = `alert alert--${type}`;
    markup.innerText = msg;

    document.querySelector('body').insertAdjacentElement('afterbegin', markup);

    window.setTimeout(hideAlert, 5000);
};