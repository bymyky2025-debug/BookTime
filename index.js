// 📅 DÁTUMKEZELÉS
const calendarGrid = document.getElementById("calendarGrid");
const currentWeekLabel = document.getElementById("currentWeekLabel");
const prevWeekBtn = document.getElementById("prevWeek");
const nextWeekBtn = document.getElementById("nextWeek");
const portal = document.getElementById("portal");
const addEventDialogBox = document.getElementById("addEventDialogBox");
const addEventForm = document.getElementById("addEventForm");
let selectedSlot = null;

let currentMonday = getMonday(new Date());

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

// 📆 HETI NAPTÁR KIRAJZOLÁS
async function renderWeek(startDate) {
  calendarGrid.innerHTML = "";
  const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];
  const timeSlots = ["10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "16:00", "16:15", "16:30", "16:45", "17:00", "17:15", "17:30", "17:45"];

  const bookedSlots = await fetchBookedSlots();

  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    const dayFormattedDate = formatDate(dayDate);

    const dayColumn = document.createElement("div");
    dayColumn.classList.add("day");

    const dayNameEl = document.createElement("div");
    dayNameEl.classList.add("dayName");
    dayNameEl.textContent = days[i];
    dayColumn.appendChild(dayNameEl);

    timeSlots.forEach(time => {
      const timeSlotEl = document.createElement("div");
      timeSlotEl.classList.add("time-slot");
      timeSlotEl.dataset.date = dayFormattedDate;
      timeSlotEl.dataset.time = time;

      const isBooked = bookedSlots.some(booked => 
          formatDate(booked.appointment_date) === dayFormattedDate && 
          booked.appointment_time === time
      );

      if (isBooked) {
          timeSlotEl.classList.add("booked");
          timeSlotEl.textContent = "Foglalt";
      } else {
          timeSlotEl.classList.add("available");
          timeSlotEl.textContent = time;
          timeSlotEl.addEventListener("click", () => {
              openPortal();
              selectedSlot = timeSlotEl;
              document.getElementById('selectedAppointment').textContent = `${dayFormattedDate} ${time}`;
          });
      }

      dayColumn.appendChild(timeSlotEl);
    });

    calendarGrid.appendChild(dayColumn);
  }

  const startLabel = startDate.toLocaleDateString("hu-HU", { month: "long", day: "numeric" });
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4);
  const endLabel = endDate.toLocaleDateString("hu-HU", { month: "long", day: "numeric" });
  currentWeekLabel.textContent = `${startDate.getFullYear()}. ${startLabel} – ${endLabel}`;
}

// 🌐 A FOGLALÁSOK LEKÉRÉSE A SZERVERRŐL
async function fetchBookedSlots() {
  try {
    // ITT A VÁLTOZÁS: relatív URL-t használunk
    const response = await fetch('/api/bookings');
    if (!response.ok) {
        throw new Error('Hiba a foglalások lekérésekor.');
    }
    const bookings = await response.json();
    return bookings;
  } catch (error) {
    console.error("❌ Hiba a foglalások lekérésekor:", error);
    return [];
  }
}

// ❌ PORTÁL BEZÁRÁS
function closePortal() {
  portal.style.display = "none";
  addEventDialogBox.style.display = "none";
  addEventForm.reset();
  selectedSlot = null;
}

// ✅ PORTÁL MEGYNYITÁS
function openPortal() {
  portal.style.display = "flex";
  addEventDialogBox.style.display = "block";
}

// 📨 FOGLALÁS ELKÜLDÉSE A SZERVERRE
addEventForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!selectedSlot) return;

  const appointmentDate = selectedSlot.dataset.date;
  const appointmentTime = selectedSlot.dataset.time;

  const bookingData = {
    contactName: document.getElementById('contactName').value,
    contactEmail: document.getElementById('contactEmail').value,
    contactTel: document.getElementById('contactTel').value,
    appointmentDate: appointmentDate,
    appointmentTime: appointmentTime
  };

  try {
    // ITT A VÁLTOZÁS: relatív URL-t használunk
    const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
    });

    if (response.ok) {
        alert("Időpont sikeresen lefoglalva!");
        closePortal();
        renderWeek(currentMonday);
    } else {
        const error = await response.json();
        alert("Hiba a foglalás során: " + error.error);
    }
  } catch (err) {
      console.error("❌ Hiba a foglalás mentésekor:", err);
      alert("Sikertelen foglalás. Ellenőrizd a szerver kapcsolatot!");
  }
});

// ⏮⏭ NAVIGÁCIÓ A HETEKBEN
prevWeekBtn.addEventListener("click", () => {
  currentMonday.setDate(currentMonday.getDate() - 7);
  renderWeek(currentMonday);
});

nextWeekBtn.addEventListener("click", () => {
  currentMonday.setDate(currentMonday.getDate() + 7);
  renderWeek(currentMonday);
});

// Indítás
renderWeek(currentMonday);
