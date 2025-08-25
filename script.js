const schedule = document.getElementById('schedule');
const subjectsContainer = document.getElementById('subjects');
const generateScheduleBtn = document.getElementById('generate-schedule');
const scheduleResult = document.getElementById('schedule-result');
const availabilityInputs = document.getElementById('availability-inputs');
const scheduleForm = document.getElementById('schedule-form');

const daysWeek = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];
let subjectsData = [];
let availabilityData = {};

schedule.addEventListener('submit', (e)=> {
    e.preventDefault(); //evitar f5
    subjectsContainer.innerHTML = '';
    schedule.style.display = 'none'; //amagar pas 1
    //les comprovacions de valors no son necesaries ja que el nombre de assignatures es "required"
    const subjects = parseInt(document.getElementById('n_subjects').value);
    for(let i=1;i<=subjects;i++){
        const div = document.createElement('div');
        div.classList.add('subject-input');

        const label = document.createElement('label');
        label.textContent = `Assignatura ${i}:`;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = `subject-name-${i}`;
        nameInput.placeholder = 'Nom de l\'assignatura';
        nameInput.required = true;

        const hoursLabel = document.createElement('label');
        hoursLabel.textContent = 'Hores setmanals:';
            
        const hoursInput = document.createElement('input');
        hoursInput.type = 'number';
        hoursInput.id = `subject-hours-${i}`;
        hoursInput.min = '1';
        hoursInput.placeholder = 'Hores per setmana';
        hoursInput.required = true;
        div.appendChild(label);
        div.appendChild(nameInput);
        div.appendChild(hoursLabel);
        div.appendChild(hoursInput);
            
        subjectsContainer.appendChild(div);
    }
    subjectsContainer.style.display = 'block'; // mostrar pas 2
    const continueBtn = document.createElement('button');
    continueBtn.type = 'button';
    continueBtn.textContent = 'Continuar al Horari';
    continueBtn.addEventListener('click', () => showAvailabilityForm(subjects));
    subjectsContainer.appendChild(continueBtn);
});
function showAvailabilityForm(nSubjects){
    subjectsData = [];
    for(let i = 1; i <= nSubjects; i++){
        const name = document.getElementById(`subject-name-${i}`).value;
        const hours = parseInt(document.getElementById(`subject-hours-${i}`).value);
        
        if (name && hours) {
            subjectsData.push({ name, hours, color: getRandomColor() });
        }
    }
    if (subjectsData.length !== nSubjects) {
        alert('Si us plau, omple tots els camps de les assignatures');
        return;
    }
    subjectsContainer.style.display = 'none'; //amagar pas 2 
    // Mostrar el formulari d'horaris (pas 3)
    scheduleForm.style.display = 'block';
    
    availabilityInputs.innerHTML = '';
    daysWeek.forEach((day)=>{
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day-availability');
        
        const dayTitle = document.createElement('h3');
        dayTitle.textContent = day;
        dayDiv.appendChild(dayTitle);
        
        const slotsContainer = document.createElement('div');
        slotsContainer.id = `slots-${day}`;
        
        const addSlotBtn = document.createElement('button');
        addSlotBtn.type = 'button';
        addSlotBtn.textContent = 'Afegir franja horària';
        addSlotBtn.addEventListener('click', () => addTimeSlot(day, slotsContainer));
        
        
        dayDiv.appendChild(slotsContainer);
        dayDiv.appendChild(addSlotBtn);
        availabilityInputs.appendChild(dayDiv);
        addTimeSlot(day, slotsContainer);
    });
}

function addTimeSlot(day, container) {
    const slotDiv = document.createElement('div');
    slotDiv.classList.add('time-slot');
    
    const startInput = document.createElement('input');
    startInput.type = 'time';
    startInput.classList.add('start-time');
    
    const endInput = document.createElement('input');
    endInput.type = 'time';
    endInput.classList.add('end-time');
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Eliminar';
    removeBtn.addEventListener('click', () => slotDiv.remove());
    
    slotDiv.appendChild(document.createTextNode('De '));
    slotDiv.appendChild(startInput);
    slotDiv.appendChild(document.createTextNode(' a '));
    slotDiv.appendChild(endInput);
    slotDiv.appendChild(removeBtn);
    container.appendChild(slotDiv);
}

generateScheduleBtn.addEventListener('click',()=>{
    const sessionDuration = parseInt(document.getElementById('session-duration').value);
    if (!sessionDuration) {
        alert('Si us plau, selecciona la durada de les sessions d\'estudi');
        return;
    }
    scheduleForm.style.display = 'none'; //amagar pas 3
    //BLOC 1: CREAR LES FRANJES HORARIES QUE EL USUARI ESTA DISPONIBLE.
    availabilityData = {};
    daysWeek.forEach((day) =>{
        const slots = [];
        const slotDivs = document.querySelectorAll(`#slots-${day} .time-slot`);
        slotDivs.forEach((slot)=>{
            const start = slot.querySelector('.start-time').value;
            const end = slot.querySelector('.end-time').value;
            if (start && end && start < end) {
                slots.push({ start, end });
            }
        });
        if (slots.length > 0) {
            availabilityData[day] = slots;
        }
    });
    if (Object.keys(availabilityData).length === 0) { //comprovar que shan entrat franjes horaries.
        alert('Afegeix les teves franjes horaries disponibles');
        return;
    }
    
    //BLOC 2 : ASSIGNAR LES ASSIGNATURES A LES FRANJES HORARIES.
    let subjects = [...subjectsData.map(s => ({ ...s, remainingHours: s.hours }))]; //copia per no modificar les dades originals.
    let sched = {};
    let currentSubjectIndex = 0;
    
    daysWeek.forEach((day)=>{
        if (!availabilityData[day]) return;
        sched[day] = [];
        
        availabilityData[day].forEach((slot)=>{
            const slotStartMinutes = timeToMinutes(slot.start);
            const slotEndMinutes = timeToMinutes(slot.end);
            const slotDuration = slotEndMinutes - slotStartMinutes;
            
            // Calcular quantes sessions es poden fer
            const sessionsInSlot = Math.floor(slotDuration / sessionDuration);
            
            // Crear sessions per la franja
            for (let i = 0; i < sessionsInSlot; i++) {
                const sessionStart = slotStartMinutes + (i * sessionDuration);
                const sessionEnd = sessionStart + sessionDuration;
                
                // Buscar una assignatura sense completar 
                let assignedSubject = null;
                for (let j = 0; j < subjects.length; j++) {
                    const subjectIndex = (currentSubjectIndex + j) % subjects.length; //recorrer de manera circular
                    if (subjects[subjectIndex].remainingHours > 0) {
                        assignedSubject = subjects[subjectIndex];
                        currentSubjectIndex = subjectIndex;
                        break;
                    }
                }
                
                if (assignedSubject) {
                    sched[day].push({
                        subject: assignedSubject.name,
                        start: minutesToTime(sessionStart),
                        end: minutesToTime(sessionEnd),
                        color: assignedSubject.color
                    });
                    
                    // Reduir les hores restants de l'assignatura
                    assignedSubject.remainingHours -= sessionDuration / 60;
                    if (assignedSubject.remainingHours <= 0) {
                        assignedSubject.remainingHours = 0;
                    }
                    
                    //Seguent assignatura
                    currentSubjectIndex = (currentSubjectIndex + 1) % subjects.length;
                }
            }
        });
    });
    
    //BLOC 3 : MOSTRAR EL PLA DESTUDIS DEFINITIU
    scheduleResult.innerHTML = `<h2>Selecciona el format de l'horari</h2>
        <div class="buttons-format">
            <button id="view-list">Format llista</button>
            <button id="view-agenda">Format agenda</button>
        </div>
    `;
    document.getElementById("view-list").addEventListener("click", ()=>{
        scheduleResult.innerHTML = ""; //amagar text previ.
        renderScheduleList(sched);
    });
    document.getElementById("view-agenda").addEventListener("click", ()=>{
        scheduleResult.innerHTML = "";
        renderScheduleAgenda(sched);
    });
});

function renderScheduleList(sched){
    scheduleResult.innerHTML = '<h2>Aquest és el teu horari (Llista)</h2>';
    daysWeek.forEach((day) =>{
        const dayDiv = document.createElement('div');
        dayDiv.innerHTML = `<h3>${day}</h3>`;
        if(sched[day] && sched[day].length>0){
            sched[day].forEach((session)=>{
                const p = document.createElement('p');
                p.textContent = `${session.subject} ${session.start} - ${session.end}`;
                dayDiv.appendChild(p);
            });
        } else {
            const p = document.createElement('p');
            p.textContent = 'No estudiaràs.';
            dayDiv.appendChild(p);
        }
        scheduleResult.appendChild(dayDiv);
    });
    const msg = document.createElement('p');
    msg.style.marginTop = '12px';
    msg.textContent = "Per descarregar l'horari en PDF, canvia al format Agenda i prem el botó corresponent.";
    scheduleResult.appendChild(msg);

    const agendaBtn = document.createElement('button');
    agendaBtn.textContent = "Veure Agenda";
    agendaBtn.style.marginTop = '5px';
    agendaBtn.addEventListener('click', () => {
        scheduleResult.innerHTML = ''; // Esborrem la llista actual
        renderScheduleAgenda(sched);  // Mostrem l'agenda
    });
    scheduleResult.appendChild(agendaBtn);
}
function renderScheduleAgenda(sched){
    scheduleResult.innerHTML = '<h2>Aquest és el teu horari (Agenda)</h2>';
    
    let earliestHour = 23;
    let latestHour = 0;
    
    // Buscar primera i ultima hora.
    for (const day in sched) {
        if (sched[day] && sched[day].length > 0) {
            sched[day].forEach(session => {
                const startHour = parseInt(session.start.split(':')[0]);
                const endHour = parseInt(session.end.split(':')[0]);
                
                if (startHour < earliestHour) earliestHour = startHour;
                if (endHour > latestHour) latestHour = endHour;
            });
        }
    }

    const table = document.createElement('table');
    table.classList.add('schedule-table');
    // Capçalera, posem al tr a un th per cada dia, dill dimarts i aixi...
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); 
    daysWeek.forEach(day => {
        const th = document.createElement('th');
        th.textContent = day;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Files per cada hora
    for (let h = earliestHour; h < latestHour; h++) {
        const row = document.createElement('tr');

        const timeCell = document.createElement('td');
        timeCell.textContent = `${h}:00 - ${h+1}:00`; //posem l'hora corresponent
        row.appendChild(timeCell);

        daysWeek.forEach(day => {
            const cell = document.createElement('td');
            if (sched[day]) {
                sched[day].forEach(session => {
                    const startH = parseInt(session.start.split(':')[0], 10);
                    const endH = parseInt(session.end.split(':')[0], 10);
                    if (h >= startH && h < endH) {
                        cell.textContent = session.subject;
                        cell.style.backgroundColor = session.color;
                    }
                });
            }
            row.appendChild(cell);
        });

        table.appendChild(row);
    }
    scheduleResult.appendChild(table);
    addDownloadButton(sched);
}

function addDownloadButton(sched) {
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Descarregar horari en format PDF";
    downloadBtn.addEventListener("click", () => downloadPDF());
    scheduleResult.appendChild(downloadBtn);
}
function downloadPDF(){
    const downloadBtn = scheduleResult.querySelector("button");
    downloadBtn.style.display = "none";
    
    html2canvas(scheduleResult).then(canvas => {
        downloadBtn.style.display = "block";
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        const today = new Date();
        const dateStr = today.toLocaleDateString('ca-ES').replace(/\//g, '-');
        
        doc.save(`Horari_Estudi_${dateStr}.pdf`);
    });
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
}
function getRandomColor() {
    const colors = [
        "lightblue", "lightcoral", "lightpink", "lightyellow", "lightgreen", 
        "lightgray", "lightcyan", "lightgoldenrodyellow", "lightseagreen","lightsteelblue"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}