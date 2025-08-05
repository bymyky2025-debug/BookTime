// 📅 DÁTUMKEZELÉS
const calendarGrid = document.getElementById("calendarGrid");
const currentWeekLabel = document.getElementById("currentWeekLabel");

let currentMonday = getMonday(new Date());

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // hétfő
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// 📆 HETI NAPTÁR KIRAJZOLÁS
async function renderWeek(startDate) {
  calendarGrid.innerHTML = "";

  const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];
  const weekDates = [];

  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    weekDates.push(dayDate);
  }

  const startLabel = weekDates[0].toLocaleDateString("hu-HU", { month: "long", day: "numeric" });
  const endLabel = weekDates[4].toLocaleDateString("hu-HU", { month: "long", day: "numeric" });
  currentWeekLabel.textContent = `${weekDates[0].getFullYear()}. ${startLabel} – ${endLabel}`;

  // Lekérdezzük a foglalásokat a szerverről
  let bookings = [];
  try {
    const res = await fetch("http://localhost:3000/bookings");
    bookings = await res.json();
  } catch (err) {
    console.error("Nem sikerült lekérni a foglalásokat:", err);
  }

  for (let i = 0; i < 5; i++) {
    const dayName = days[i];
    const date = weekDates[i];
    const dateStr = formatDate(date);

    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    dayDiv.dataset.date = dateStr;

    dayDiv.innerHTML = `
      <div class="dayName">
        <span>${dayName}</span><br>
        <span class="date">${dateStr}</span>
      </div>
      <div class="dayEvents">
        ${generateTimeSlots(dateStr, bookings)}
      </div>
    `;
    calendarGrid.appendChild(dayDiv);
  }

  attachTimeSlotEvents();
}


// 🪟 FOGALALÁSI PORTÁL MEGNYITÁSA
function openPortal(date, time, slotElement) {
  selectedDateStr = date;
  selectedTimeStr = time;
  selectedSlot = slotElement;

  document.getElementById("portal").style.display = "block";
  document.getElementById("addEventDialogBox").style.display = "block";

  const h3 = document.querySelector("#addEventDialogBox h3");
  if (h3) {
    h3.textContent = `Foglalás: ${date}, ${time}`;
  }

  document.getElementById("addEventForm").reset();
}

function generateTimeSlots(dateStr, bookings = []) {
  const slots = [
    "10:00–10:15", "10:30–10:45",
    "11:00–11:15", "11:30–11:45",
    "12:00–12:15", "12:30–12:45",
    "13:00–13:15", "13:30–13:45",
    "16:00–16:15", "16:30–16:45",
    "18:00–18:15", "18:30–18:45",
  ];

  return slots.map(slot => {
    const isBooked = bookings.some(b => {
      const dbDate = new Date(b.appointment_date);
      const localDateStr = dbDate.getFullYear() + '-' +
        String(dbDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(dbDate.getDate()).padStart(2, '0');

      return localDateStr === dateStr && b.appointment_time.replace(/\s/g, '') === slot.replace(/\s/g, '');
    });

    return `<div class="dayTime ${isBooked ? 'booked' : ''}" data-date="${dateStr}" data-time="${slot}">
      ${slot}
    </div>`;
  }).join("");
}


// 🎯 ESEMÉNYHOZZÁADÁS KEZELÉS
function attachTimeSlotEvents() {
  document.querySelectorAll(".dayTime").forEach(slot => {
    slot.addEventListener("click", () => {
      if (slot.classList.contains("booked")) return;

      const selectedDate = slot.dataset.date;
      const selectedTime = slot.dataset.time;

      openPortal(selectedDate, selectedTime, slot);
    });
  });

window.closePortal = function () {
  document.getElementById("portal").style.display = "none";
  document.getElementById("addEventDialogBox").style.display = "none";
};


}

// 🪟 FOGALALÁSI PORTÁL MEGNYITÁSA
// Globális változók (ezek legyenek felül is definiálva)
let selectedDateStr = "";
let selectedTimeStr = "";
let selectedSlot = null;

// Form küldése esemény
document.getElementById("addEventForm").addEventListener("submit", function (e) {
  e.preventDefault();



  const name = e.target.elements.contactName.value.trim();
  const email = e.target.elements.contactEmail.value.trim();
  const tel = e.target.elements.contactTel.value.trim();

  if (!name || !email || !tel) {
    alert("Kérlek, minden mezőt tölts ki!");
    return;
  }

  const templateParams = {
    contactName: name,
    contactEmail: email,
    contactTel: tel,
    contactMessage: `Időpont foglalás 15 perces konzultációra: ${selectedDateStr}, ${selectedTimeStr}`,
    appointmentDate: selectedDateStr,
    appointmentTime: selectedTimeStr
  };

  // Küldés EmailJS-sel
  emailjs.send("service_0mkavr2", "template_oxjexwn", templateParams)
    .then(function () {
      // Email sikeres, DOM frissítése
      selectedSlot.innerHTML = `
        <div class="event">
          <div class="eventTitle">${name}</div>
          <div class="eventTime">${selectedTimeStr}</div>
        </div>`;
      selectedSlot.classList.add("booked");

      // Mentés szerverre (PostgreSQL)
      fetch("http://localhost:3000/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateParams)
      })
        .then(res => res.json())
        .then(data => {
          console.log("✅ Foglalás elmentve a szerveren:", data);
        })
        .catch(err => {
          console.error("❌ Hiba a mentéskor:", err);
        });

      alert("Foglalás sikeresen elküldve!");
      closePortal();
    }, function (error) {
      alert("Hiba történt a küldés során: " + error.text);
    });
}); // ← EZ A ZÁRÓZÁRÓJEL HIÁNYZOTT ‼️



// ❌ PORTÁL BEZÁRÁS
function closePortal() {
  document.getElementById("portal").style.display = "none";
  document.getElementById("addEventDialogBox").style.display = "none";
}

// ⏮⏭ NAVIGÁCIÓ A HETEKBEN
document.getElementById("prevWeek").addEventListener("click", () => {
  currentMonday.setDate(currentMonday.getDate() - 7);
  renderWeek(currentMonday);
});

document.getElementById("nextWeek").addEventListener("click", () => {
  currentMonday.setDate(currentMonday.getDate() + 7);
  renderWeek(currentMonday);
});

// 🚀 KEZDÉS
renderWeek(currentMonday);

// Bezárás ESC billentyűre vagy háttérkattintásra
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closePortal();
  }
});

function closePortal() {
  document.getElementById("portal").style.display = "none";
  document.getElementById("addEventDialogBox").style.display = "none";
}

document.getElementById("portal").addEventListener("click", function (e) {
  if (e.target.id === "portal") {
    closePortal();
  }
});


