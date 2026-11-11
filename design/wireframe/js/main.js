// Wireframe controls – Group 5, COS30045
// Wireframe controls: switch between desktop and phone widths, and show/hide design notes.
const desktopBtn = document.getElementById('btn-desktop');
const phoneBtn = document.getElementById('btn-phone');
const notesBtn = document.getElementById('btn-notes');

function setView(phone) {
  document.body.classList.toggle('phone', phone);
  phoneBtn.setAttribute('aria-pressed', String(phone));
  desktopBtn.setAttribute('aria-pressed', String(!phone));
}
desktopBtn.addEventListener('click', () => setView(false));
phoneBtn.addEventListener('click', () => setView(true));

notesBtn.addEventListener('click', () => {
  const hidden = document.body.classList.toggle('hide-notes');
  notesBtn.setAttribute('aria-pressed', String(!hidden));
  notesBtn.textContent = hidden ? 'Design notes off' : 'Design notes on';
});
