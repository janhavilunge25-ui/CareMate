/* ===== Splash screen: shows the CareMate logo, then fades into the page ===== */
(function () {
    const splash = document.querySelector('#splash-screen');
    if (!splash) return;

    const MIN_DISPLAY_MS = 1600; // keep the logo on screen at least this long

    function hideSplash() {
        splash.classList.add('fade-out');
        splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    }

    window.addEventListener('load', () => {
        setTimeout(hideSplash, MIN_DISPLAY_MS);
    });
})();

const loginBtn = document.querySelector('.login-btn');
const coverBox = document.querySelector('.cover_box');
const loginForm = document.querySelector('.form-box.login');
const registerForm = document.querySelector('.form-box.register');
const loginLinks = document.querySelectorAll('.login-link');
const registerLinks = document.querySelectorAll('.register-link');
const closeIcons = document.querySelectorAll('.icon-close');

function openCoverBox(){
    coverBox.classList.add('active');
}

function closeCoverBox(){
    coverBox.classList.remove('active');
}

function showRegister(e){
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
}

function showLogin(e){
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
}

// Only wire these up if the elements actually exist on the current page
if (loginBtn) {
    loginBtn.addEventListener('click', openCoverBox);
}

closeIcons.forEach(icon => icon.addEventListener('click', closeCoverBox));
registerLinks.forEach(link => link.addEventListener('click', showRegister));
loginLinks.forEach(link => link.addEventListener('click', showLogin));

/*close the box when clicking outside the card
coverBox.addEventListener('click', (e) => {
    if(e.target === coverBox){
        closeCoverBox();
    }
});   when we click outside the form box, the cover box will close.*/


/* ===== Login / Register: validation, show-hide password, then continue to the profile page ===== */
(function () {
  if (!loginForm && !registerForm) return;
  const USER_KEY = 'careMateUser';
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const getUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; } };

  /* small message bar (re-used on every page) */
  function toast(msg) {
    let t = document.getElementById('cmToast');
    if (!t) { t = document.createElement('div'); t.id = 'cmToast'; t.className = 'cm-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* shows / clears the red message under a field */
  function setErr(input, msg) {
    const box = input.closest('.input-box') || input.closest('.remember-forgot');
    if (!box) return;
    let e = box.nextElementSibling;
    if (!e || !e.classList.contains('auth-err')) {
      e = document.createElement('p'); e.className = 'auth-err'; e.setAttribute('role', 'alert'); box.after(e);
    }
    e.textContent = msg || '';
    box.classList.toggle('has-err', !!msg);
  }

  /* eye button on every password field */
  document.querySelectorAll('.cover_box input[type="password"]').forEach(inp => {
    inp.classList.add('has-pw');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pw-toggle'; b.setAttribute('aria-label', 'Show password');
    b.innerHTML = '<i class="fa-solid fa-eye"></i>';
    b.addEventListener('click', () => {
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      b.firstChild.className = 'fa-solid ' + (show ? 'fa-eye-slash' : 'fa-eye');
    });
    inp.parentElement.appendChild(b);
  });

  /* wires one form: validate -> remember the name -> go to the profile page */
  function wire(formBox, validate, buildUser) {
    const f = formBox && formBox.querySelector('form');
    if (!f) return;
    f.setAttribute('novalidate', '');
    const btn = f.querySelector('.btn');
    f.addEventListener('submit', e => {
      e.preventDefault();
      const el = f.elements;
      const bad = [];
      const chk = (field, ok, msg) => { setErr(field, ok ? '' : msg); if (!ok) bad.push(field); };
      validate(el, chk);
      if (bad.length) { bad[0].focus(); return; }

      try { localStorage.setItem(USER_KEY, JSON.stringify(buildUser(el))); } catch (err) {}
      // TODO: replace with a real API call once the backend is ready:
      // fetch('/api/login', { method: 'POST', body: JSON.stringify({ email: el.email.value, password: el.password.value }) })

      btn.classList.add('is-loading');
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Please wait';
      setTimeout(() => { window.location.href = 'profile.html'; }, 700);   // <-- match your actual filename
    });
    f.querySelectorAll('input').forEach(i => i.addEventListener('input', () => setErr(i, '')));
  }

  wire(loginForm, (el, chk) => {
    chk(el.email,    emailOk(el.email.value),        'Enter a valid email address.');
    chk(el.password, el.password.value.length >= 6,  'Password must be at least 6 characters.');
  }, el => {
    const email = el.email.value.trim(), u = getUser();
    const guess = email.split('@')[0].replace(/[._-]+/g, ' ');
    return { name: (u && u.email === email && u.name) ? u.name : guess.charAt(0).toUpperCase() + guess.slice(1), email };
  });

  wire(registerForm, (el, chk) => {
    chk(el.username, el.username.value.trim().length >= 2, 'Please enter your name.');
    chk(el.email,    emailOk(el.email.value),              'Enter a valid email address.');
    chk(el.password, el.password.value.length >= 6,        'Password must be at least 6 characters.');
    chk(el.confirm,  el.confirm.value === el.password.value && el.confirm.value !== '', 'Passwords do not match.');
    chk(el.terms,    el.terms.checked,                     'Please accept the terms to continue.');
  }, el => ({ name: el.username.value.trim(), email: el.email.value.trim() }));

  /* "Forgot password?" has no server behind it yet, so say so clearly */
  document.querySelectorAll('.remember-forgot a[href="#"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    toast('Password reset will be available once accounts are connected to the server.');
  }));

  /* modal behaviour: click outside / Esc closes, page stops scrolling, first field gets focus */
  const box = document.querySelector('.cover_box');
  if (box) {
    box.addEventListener('click', e => { if (e.target === box) closeCoverBox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('active')) closeCoverBox(); });
    closeIcons.forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeCoverBox(); } }));
    new MutationObserver(records => {
      if (!records.some(r => r.target === box || r.target.classList.contains('form-box'))) return;
      const open = box.classList.contains('active');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) setTimeout(() => { const f = box.querySelector('.form-box.active input'); if (f) f.focus(); }, 60);
    }).observe(box, { attributes: true, attributeFilter: ['class'], subtree: true });
  }
})();

/* ===== Optional BP / blood sugar logging — anyone can opt in, independent of condition ===== */
const hasBpCheckbox = document.querySelector('#hasBp');
const hasSugarCheckbox = document.querySelector('#hasSugar');
const bpSection = document.querySelector('#bpSection');
const sugarSection = document.querySelector('#sugarSection');

function updateBpSection(){
    if (!hasBpCheckbox || !bpSection) return;
    const show = hasBpCheckbox.checked;
    bpSection.hidden = !show;
    if (!show) {
        document.querySelector('#bpSystolic').value = '';
        document.querySelector('#bpDiastolic').value = '';
    }
}

function updateSugarSection(){
    if (!hasSugarCheckbox || !sugarSection) return;
    const show = hasSugarCheckbox.checked;
    sugarSection.hidden = !show;
    if (!show) {
        document.querySelector('#sugarLevel').value = '';
        document.querySelector('#sugarType').value = '';
    }
}

if (hasBpCheckbox) hasBpCheckbox.addEventListener('change', updateBpSection);
if (hasSugarCheckbox) hasSugarCheckbox.addEventListener('change', updateSugarSection);

/* ===== Health profile form ("Get my plan" button) ===== */
const profileForm = document.querySelector('#profileForm');

if (profileForm) {
    profileForm.addEventListener('submit', function(e){
        e.preventDefault();

        const goals = Array.from(
            document.querySelectorAll('#goalsGrid input[name="goals"]:checked')
        ).map(cb => cb.value);

        const profileData = {
            fullName: document.querySelector('#fullName').value.trim(),
            age: document.querySelector('#age').value.trim(),
            weight: document.querySelector('#weight').value.trim(),
            gender: document.querySelector('#gender').value,
            activity: document.querySelector('#activity').value,
            condition: document.querySelector('#condition').value,
            foodPref: document.querySelector('#foodPref').value,
            notes: document.querySelector('#notes').value.trim(),
            goals: goals
        };

        // Optional — only included if the user opted in, and never required to submit
        if (hasBpCheckbox && hasBpCheckbox.checked) {
            profileData.bp = {
                systolic: document.querySelector('#bpSystolic').value.trim(),
                diastolic: document.querySelector('#bpDiastolic').value.trim()
            };
        }
        if (hasSugarCheckbox && hasSugarCheckbox.checked) {
            profileData.sugar = {
                level: document.querySelector('#sugarLevel').value.trim(),
                type: document.querySelector('#sugarType').value
            };
        }

        if (!profileData.fullName || !profileData.age || !profileData.weight || !profileData.gender ||
            !profileData.activity || !profileData.condition || !profileData.foodPref) {
            CareMatePlan.say('Please fill in all required fields before continuing.');
            return;
        }

        localStorage.setItem('careMateProfile', JSON.stringify(profileData));

        // TODO: replace this with an API call once the backend is ready
        // fetch('/api/profile', { method: 'POST', body: JSON.stringify(profileData) })

        // CHANGED (was: window.location.href = 'profile.html'; which just reloaded this page).
        // Now shows Step 3 "Your plan" right here, only for the areas the user ticked.
        CareMatePlan.show(profileData);
    });
}

/* =====================================================================
   Step 3 · Your plan
   Shows ONLY the sections the user ticked under "What would you like help with?".
   Diet guidance is prepared with the team dietitian: general wellness guidance only.

   LATEST CHANGES (search for "NEW" or "CHANGED"):
     - "Exercise Routine"  → "Yoga"            (condition-wise poses table)
     - "Coach Guidance"    → "Condition Info"  (written info + videos for the chosen condition)
     - Added Obesity / Under weight conditions
   ===================================================================== */
const CareMatePlan = (function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ---------- labels ---------- */
  const ORDER = ['diet', 'yoga', 'meditation', 'tracking', 'reminders', 'info'];   // CHANGED (exercise→yoga, coach→info)
  const GOAL = {
    diet:       { title: 'Diet Plan',                 icon: 'fa-utensils' },
    yoga:       { title: 'Yoga',                      icon: 'fa-om' },               // CHANGED
    meditation: { title: 'Meditation & Stress Relief', icon: 'fa-spa' },
    tracking:   { title: 'Progress Tracking',         icon: 'fa-chart-line' },
    reminders:  { title: 'Reminders',                 icon: 'fa-bell' },
    info:       { title: 'Condition Info',            icon: 'fa-circle-info' }       // CHANGED
  };
  const ACTIVITY  = { sedentary: 'Low activity', light: 'Lightly active', active: 'Active' };
  const FOODPREF  = { veg: 'Vegetarian', nonveg: 'Non-vegetarian', vegan: 'Vegan' };
  const CONDITION = {                                                              // CHANGED (added obesity, underweight)
    pcod: 'PCOD', pcos: 'PCOS', ibd: 'IBD', diabetes: 'Diabetes / Blood sugar',
    bp: 'Blood pressure', obesity: 'Obesity', underweight: 'Under weight', general: 'General wellness'
  };

  /* ---------- guidance tables ---------- */
  /* Condition-specific general tips (shown as a note; never a diagnosis or treatment) */
  const COND_TIPS = {
    pcod:     { diet: 'Choose whole grains, add protein to every meal and limit sugary drinks and refined snacks.' },
    pcos:     { diet: 'Choose whole grains, add protein to every meal and limit sugary drinks and refined snacks.' },
    diabetes: { diet: 'Keep meal times regular, prefer whole grains and pulses, and avoid sugary drinks.' },
    bp:       { diet: 'Keep salt low: go easy on pickles, papad, chips and packaged food.' },
    ibd:      { diet: 'Eat smaller, regular meals and note which foods trigger symptoms. Follow your doctor’s or dietitian’s plan.' },
    obesity:  { diet: 'Watch portion sizes, fill half your plate with vegetables and limit fried food and sugary drinks.' },        // NEW
    underweight: { diet: 'Eat 5 to 6 smaller meals, add protein and healthy fats such as nuts, milk and ghee to each meal.' }      // NEW
  };

  /* Meals by food preference */
  const MEALS = {
    veg: [
      ['Breakfast',   'Vegetable poha or besan chilla, 1 cup milk or curd'],
      ['Mid-morning', '1 seasonal fruit, a handful of nuts'],
      ['Lunch',       '2 rotis, dal, 1 cup sabzi, salad, curd'],
      ['Evening',     'Roasted chana, sprouts chaat or buttermilk'],
      ['Dinner',      'Vegetable khichdi, or 1–2 rotis with paneer or dal']
    ],
    nonveg: [
      ['Breakfast',   'Vegetable poha or upma, 1–2 boiled eggs, 1 cup milk'],
      ['Mid-morning', '1 seasonal fruit, a handful of nuts'],
      ['Lunch',       '2 rotis, dal or a small portion of chicken or fish curry, sabzi, salad'],
      ['Evening',     'Roasted chana, egg or buttermilk'],
      ['Dinner',      '1–2 rotis with grilled chicken or fish, or vegetable khichdi']
    ],
    vegan: [
      ['Breakfast',   'Vegetable poha or oats with fruit, nuts and soy or other plant milk'],
      ['Mid-morning', '1 seasonal fruit, a handful of nuts or seeds'],
      ['Lunch',       '2 rotis or 1 cup rice, dal, rajma or chole, sabzi, salad'],
      ['Evening',     'Roasted chana, sprouts chaat or fruit'],
      ['Dinner',      'Vegetable khichdi, or 1–2 rotis with tofu or dal']
    ]
  };

  /* ===== NEW: Yoga poses per condition → [pose, benefit, time]. General guidance only. ===== */
  const YOGA = {
    pcod: [
      ['Surya Namaskar (slow)',  'Full-body movement, supports metabolism',      '5 rounds'],
      ['Baddha Konasana',        'Opens hips, eases pelvic tension',             '2 min'],
      ['Bhujangasana',           'Stretches abdomen, supports hormone balance',  '1 min'],
      ['Setu Bandhasana',        'Strengthens back and core',                    '1 min'],
      ['Balasana',               'Calms the mind, reduces stress',               '2 min']
    ],
    ibd: [
      ['Pawanmuktasana',          'Eases gas and bloating',                      '1 min'],
      ['Marjaryasana-Bitilasana', 'Gentle spine and belly movement',             '2 min'],
      ['Supta Matsyendrasana',    'Gentle twist, relaxes the abdomen',           '1 min each side'],
      ['Vajrasana',               'Sit after meals to support digestion',        '5 min'],
      ['Shavasana',               'Full relaxation, lowers stress',              '5 min']
    ],
    diabetes: [
      ['Surya Namaskar (slow)',   'Keeps the whole body active',                 '5 rounds'],
      ['Ardha Matsyendrasana',    'Stimulates the abdominal organs',             '1 min each side'],
      ['Paschimottanasana',       'Stretches back, calms the nervous system',    '1 min'],
      ['Vajrasana',               'Sit after meals to support digestion',        '5 min'],
      ['Shavasana',               'Reduces stress',                              '5 min']
    ],
    bp: [
      ['Tadasana',                       'Posture and balance, easy on the heart', '1 min'],
      ['Sukhasana + slow breathing',     'Calms the mind',                         '3 min'],
      ['Balasana',                       'Relaxes the back and nerves',            '2 min'],
      ['Viparita Karani (legs on wall)', 'Gentle relaxation',                      '3 min'],
      ['Shavasana',                      'Full relaxation',                        '5 min']
    ],
    obesity: [
      ['Surya Namaskar',          'Burns energy, works the whole body',          '8 rounds'],
      ['Utkatasana',              'Strengthens legs and core',                   '30 sec × 3'],
      ['Trikonasana',             'Stretches sides, tones the waist',            '1 min each side'],
      ['Virabhadrasana II',       'Builds stamina and leg strength',             '1 min each side'],
      ['Shavasana',               'Recovery and stress relief',                  '5 min']
    ],
    underweight: [
      ['Tadasana',                'Improves posture and body awareness',         '1 min'],
      ['Bhujangasana',            'Opens the chest, supports appetite',          '1 min'],
      ['Setu Bandhasana',         'Builds back and leg strength',                '1 min'],
      ['Paschimottanasana',       'Supports digestion',                          '1 min'],
      ['Shavasana',               'Rest helps the body recover',                 '5 min']
    ],
    general: [
      ['Surya Namaskar',          'Warm-up for the whole body',                  '5 rounds'],
      ['Tadasana',                'Posture and balance',                         '1 min'],
      ['Trikonasana',             'Stretches sides and legs',                    '1 min each side'],
      ['Bhujangasana',            'Strengthens the back',                        '1 min'],
      ['Shavasana',               'Relaxation',                                  '5 min']
    ]
  };
  YOGA.pcos = YOGA.pcod;   // same routine for PCOS

  /* NEW: one safety note per condition, shown under the yoga table */
  const YOGA_CAUTION = {
    bp:       'Move slowly, never hold your breath, and avoid head-down poses.',
    diabetes: 'Keep a small snack nearby and avoid yoga on an empty stomach if you feel weak.',
    ibd:      'Skip any pose that causes pain, and rest on flare-up days.',
    pcod:     'Practise regularly, 5 to 6 days a week, for the best effect.',
    pcos:     'Practise regularly, 5 to 6 days a week, for the best effect.',
    obesity:  'Start with fewer rounds and build up slowly. Protect your knees and back.',
    underweight: 'Keep sessions gentle and eat a light snack afterwards.'
  };

  /* ===== NEW: Written info per condition → [label, text]. General education, not diagnosis. ===== */
  const COND_INFO = {
    pcod: [
      ['What it is',      'A common hormonal condition where the ovaries release many immature eggs, often linked with irregular periods.'],
      ['Common signs',    'Irregular or missed periods, weight gain, acne, extra facial or body hair, hair thinning.'],
      ['What can help',   'Balanced meals with protein and fibre, regular movement, good sleep and stress management.'],
      ['Go easy on',      'Sugary drinks, refined snacks, long gaps between meals and crash diets.'],
      ['See a doctor if', 'Periods stop for 3 months or more, pain is severe, or you have trouble conceiving.']
    ],
    pcos: [
      ['What it is',      'A hormone-related condition with irregular ovulation, higher male-hormone levels and sometimes small ovarian cysts.'],
      ['Common signs',    'Irregular periods, weight gain, acne, excess hair growth, scalp hair thinning.'],
      ['What can help',   'Whole grains, protein with every meal, regular walking and strength work, enough sleep.'],
      ['Go easy on',      'Sugary drinks, refined flour snacks, skipping meals and crash diets.'],
      ['See a doctor if', 'Periods are very irregular, symptoms get worse, or you are planning pregnancy.']
    ],
    ibd: [
      ['What it is',      'Long-term inflammation of the digestive tract. The two main types are Crohn’s disease and ulcerative colitis.'],
      ['Common signs',    'Ongoing diarrhoea, stomach pain, blood in stool, tiredness and weight loss.'],
      ['What can help',   'Smaller regular meals, a food diary to spot triggers, plenty of fluids, gentle activity and stress control.'],
      ['Go easy on',      'Your personal trigger foods, very spicy or oily meals, and skipping prescribed medicines.'],
      ['See a doctor if', 'You see blood in stool, have severe pain or fever, or symptoms suddenly worsen.']
    ],
    diabetes: [
      ['What it is',      'A condition where blood sugar stays higher than normal because the body makes too little insulin or cannot use it well.'],
      ['Common signs',    'Increased thirst, frequent urination, tiredness, blurred vision and slow-healing wounds.'],
      ['What can help',   'Regular meal times, whole grains and pulses, daily walking, enough water and sugar checks as advised.'],
      ['Go easy on',      'Sugary drinks, sweets, skipping meals and long gaps without food.'],
      ['See a doctor if', 'Readings stay high or very low, or you feel faint, confused or very unwell.']
    ],
    bp: [
      ['What it is',      'Blood pressure is the force of blood on your artery walls. Hypertension means it stays higher than normal.'],
      ['Common signs',    'Often none. Some people notice headaches, dizziness or a pounding heartbeat.'],
      ['What can help',   'Low salt, fruits and vegetables, daily walking, a healthy weight, good sleep and regular checks.'],
      ['Go easy on',      'Pickles, papad, chips, packaged food, too much caffeine, smoking and alcohol.'],
      ['See a doctor if', 'You have a severe headache, chest pain, breathlessness or very high readings.']
    ],
    obesity: [
      ['What it is',      'Having excess body fat, which can raise the risk of other health problems.'],
      ['Common signs',    'Weight gain, breathlessness on light effort, tiredness and joint pain.'],
      ['What can help',   'Portion control, more vegetables and protein, daily walking, 7–8 hours of sleep and slow, steady progress.'],
      ['Go easy on',      'Sugary drinks, fried food, late-night snacking and crash diets.'],
      ['See a doctor if', 'Weight changes quickly, joints hurt, or you feel breathless at rest.']
    ],
    underweight: [
      ['What it is',      'Body weight below the healthy range for your height. It can mean the body is not getting enough nutrition.'],
      ['Common signs',    'Tiredness, frequent illness, weak muscles, hair loss and missed periods.'],
      ['What can help',   'More frequent meals, enough protein, healthy fats such as nuts and ghee, light strength work and good sleep.'],
      ['Go easy on',      'Skipping meals, too much intense cardio, and tea or coffee on an empty stomach.'],
      ['See a doctor if', 'You lose weight without trying or feel tired all the time.']
    ],
    general: [
      ['What it is',      'General wellness means looking after food, movement, sleep and stress together.'],
      ['Good habits',     'Balanced meals, 8 glasses of water, 30 minutes of movement and 7–8 hours of sleep.'],
      ['What can help',   'Change one habit at a time and review your progress every Sunday.'],
      ['Go easy on',      'Sugary drinks, too much screen time at night and skipping meals.'],
      ['See a doctor if', 'You feel unwell for several days or notice sudden changes in weight or energy.']
    ]
  };


  /* =====================================================================
     MORE CONDITIONS (added): labels, diet tips, yoga, cautions and written info.
     All general guidance only. Please let the dietitian review the text below.
     ===================================================================== */
  Object.assign(CONDITION, {
    htndm: 'Hypertension & Diabetes', thyroid: 'Thyroid', anaemia: 'Anaemia', immunity: 'Low immunity',
    arthritis: 'Arthritis & bone health', pregnancy: 'Pregnancy & lactation', child: 'Child health',
    detox: 'Detox therapy', kidney: 'Kidney stone', cancer: 'Cancer malnutrition',
    obesity: 'Obesity management', underweight: 'Weight gain'
  });

  Object.assign(COND_TIPS, {
    htndm:     { diet: 'Keep salt low and meal times regular. Choose whole grains and pulses, add vegetables to every meal and avoid sugary drinks.' },
    thyroid:   { diet: 'Eat regular meals with enough protein and include nuts and seeds. Use iodised salt in normal amounts and take thyroid medicine exactly as your doctor advises.' },
    anaemia:   { diet: 'Add iron-rich foods such as green leafy vegetables, beetroot, dates, jaggery and pulses, together with a vitamin C food like lemon or amla. Avoid tea or coffee with meals.' },
    immunity:  { diet: 'Eat a colourful variety of fruits, vegetables, pulses and nuts. Include a vitamin C fruit daily, drink enough water and keep fixed meal times.' },
    arthritis: { diet: 'Include calcium-rich foods such as milk, curd, ragi and sesame, and get safe morning sunlight for vitamin D. Add walnuts or flaxseeds and keep a healthy weight.' },
    pregnancy: { diet: 'Eat small, regular meals with protein, iron, folate and calcium foods and drink plenty of fluids. Avoid raw or undercooked food and unpasteurised milk, and take supplements only as your doctor prescribes. Please follow your doctor’s advice for portions.' },
    child:     { diet: 'Offer a balanced plate with fruit, vegetables, pulses, milk or curd and whole grains. Keep junk food occasional, and never put a child on a strict diet without a paediatrician’s advice.' },
    detox:     { diet: 'Keep it gentle: more water, vegetables, fruit and fibre, and less sugar, fried and packaged food. Avoid extreme juice-only or fasting cleanses.' },
    kidney:    { diet: 'Drink enough water through the day as your doctor advises, keep salt low and eat a balanced diet. Foods to limit depend on your stone type, so follow your doctor’s advice.' },
    cancer:    { diet: 'Aim for small, frequent, protein-rich and energy-dense meals that you can tolerate. Your oncologist or oncology dietitian should guide your exact diet during treatment.' }
  });

  Object.assign(YOGA, {
    htndm: [
      ['Tadasana',                    'Posture and balance, easy on the heart', '1 min'],
      ['Sukhasana + slow breathing',  'Calms the mind and body',                '3 min'],
      ['Ardha Matsyendrasana',        'Gentle twist, supports digestion',       '1 min each side'],
      ['Vajrasana',                   'Sit after meals to aid digestion',       '5 min'],
      ['Shavasana',                   'Full relaxation',                        '5 min']
    ],
    thyroid: [
      ['Surya Namaskar (slow)',       'Gentle full-body movement',              '5 rounds'],
      ['Marjaryasana-Bitilasana',     'Eases the neck and spine',               '2 min'],
      ['Setu Bandhasana',             'Opens the chest and throat area',        '1 min'],
      ['Simhasana (lion breath)',     'Releases tension in the throat',         '1 min'],
      ['Shavasana',                   'Relaxation',                             '5 min']
    ],
    anaemia: [
      ['Tadasana',                    'Posture and steady breathing',           '1 min'],
      ['Vajrasana',                   'Calm seated pose, aids digestion',       '3 min'],
      ['Bhujangasana',                'Opens the chest for easier breathing',   '1 min'],
      ['Balasana',                    'Restful pose, relaxes the body',         '2 min'],
      ['Shavasana',                   'Rest and recovery',                      '5 min']
    ],
    immunity: [
      ['Surya Namaskar',              'Warms and wakes up the whole body',      '5 rounds'],
      ['Tadasana',                    'Posture and deep breathing',             '1 min'],
      ['Vrikshasana',                 'Balance and focus',                      '30 sec each side'],
      ['Bhujangasana',                'Opens the chest, supports breathing',    '1 min'],
      ['Shavasana',                   'Deep rest, lowers stress',               '5 min']
    ],
    arthritis: [
      ['Tadasana (wall support)',     'Posture and balance',                    '1 min'],
      ['Sukhasana',                   'Gentle hip and back posture',            '3 min'],
      ['Pawanmuktasana (gentle)',     'Eases hips and lower back',              '1 min'],
      ['Marjaryasana-Bitilasana',     'Moves the spine gently',                 '2 min'],
      ['Shavasana',                   'Relaxes stiff muscles',                  '5 min']
    ],
    pregnancy: [
      ['Sukhasana + slow breathing',  'Calms the mind, eases tension',          '3 min'],
      ['Marjaryasana-Bitilasana',     'Relieves back strain',                   '2 min'],
      ['Baddha Konasana (supported)', 'Opens the hips gently',                  '2 min'],
      ['Tadasana',                    'Posture and balance',                    '1 min'],
      ['Shavasana on your left side', 'Rest with cushions for comfort',         '5 min']
    ],
    child: [
      ['Tadasana (mountain)',         'Stand tall and strong',                  '30 sec'],
      ['Vrikshasana (tree)',          'Balance and focus',                      '30 sec each side'],
      ['Bhujangasana (snake)',        'Strengthens the back',                   '30 sec'],
      ['Marjaryasana (cat)',          'Gentle spine stretch',                   '1 min'],
      ['Shavasana (rest)',            'Calm and quiet time',                    '2 min']
    ],
    detox: [
      ['Surya Namaskar',              'Gets the body moving',                   '5 rounds'],
      ['Ardha Matsyendrasana',        'Gentle twist, supports digestion',       '1 min each side'],
      ['Bhujangasana',                'Stretches the abdomen',                  '1 min'],
      ['Pawanmuktasana',              'Eases gas and bloating',                 '1 min'],
      ['Shavasana',                   'Rest and reset',                         '5 min']
    ],
    kidney: [
      ['Tadasana',                    'Posture and balance',                    '1 min'],
      ['Trikonasana',                 'Stretches the sides of the body',        '1 min each side'],
      ['Pawanmuktasana',              'Eases the abdomen',                      '1 min'],
      ['Bhujangasana',                'Gentle back stretch',                    '1 min'],
      ['Shavasana',                   'Relaxation',                             '5 min']
    ],
    cancer: [
      ['Sukhasana + slow breathing',  'Calms the mind and eases stress',        '3 min'],
      ['Seated neck and shoulder rolls', 'Releases tension',                    '2 min'],
      ['Marjaryasana-Bitilasana (gentle)', 'Moves the spine softly',            '2 min'],
      ['Balasana (supported)',        'Restful pose',                           '2 min'],
      ['Shavasana',                   'Deep rest',                              '5 min']
    ]
  });

  Object.assign(YOGA_CAUTION, {
    htndm:     'Move slowly, never hold your breath and avoid head-down poses. If you take diabetes medicine, keep a small snack nearby.',
    thyroid:   'Go slowly with neck movements and stop if you feel dizzy.',
    anaemia:   'Rise slowly after lying down, and rest if you feel dizzy or breathless.',
    immunity:  'Build up slowly and rest well, especially while recovering from an illness.',
    arthritis: 'Stay within a pain-free range and use a wall or chair for support. Skip deep knee bends if your knees hurt.',
    pregnancy: 'Practise only with your doctor’s approval. Avoid lying flat on your back, deep twists, strong stretches and head-down poses.',
    child:     'Keep it fun and short, with an adult nearby. Never force a pose.',
    detox:     'Yoga supports digestion and calm, while your liver and kidneys do the real cleansing. Avoid extreme fasting.',
    kidney:    'Stay hydrated and stop if you feel back or side pain. See your doctor for severe pain.',
    cancer:    'Practise only with your oncology team’s approval, keep it very gentle and rest whenever you need.'
  });

  Object.assign(COND_INFO, {
    htndm: [
      ['What it is',      'Hypertension is high blood pressure and DM (diabetes mellitus) is high blood sugar. Many people have both, and together they strain the heart and kidneys, so they are managed together.'],
      ['Common signs',    'Often none. Some people feel headaches, tiredness, thirst, frequent urination or blurred vision.'],
      ['What can help',   'Low salt, regular meal times, whole grains, vegetables, daily walking, a healthy weight and regular blood pressure and sugar checks.'],
      ['Go easy on',      'Salty and packaged food, sugary drinks and sweets, skipping meals and smoking.'],
      ['See a doctor if', 'Readings stay very high or low, or you have chest pain, a severe headache, confusion or feel very unwell.']
    ],
    thyroid: [
      ['What it is',      'The thyroid is a small gland in the neck that controls energy and metabolism. It can be underactive (hypothyroidism) or overactive (hyperthyroidism).'],
      ['Common signs',    'Tiredness, weight change, feeling too cold or too hot, hair thinning, mood changes or swelling in the neck.'],
      ['What can help',   'Regular meals, enough protein, iodised salt in normal amounts, nuts and seeds, daily movement and taking your medicine on time as advised.'],
      ['Go easy on',      'Extra iodine or supplements without advice, crash diets and skipping medicine.'],
      ['See a doctor if', 'You notice neck swelling, a very fast or slow heartbeat, marked weight change or symptoms that do not improve.']
    ],
    anaemia: [
      ['What it is',      'A low level of haemoglobin or red blood cells, so the body gets less oxygen. Low iron is a common cause.'],
      ['Common signs',    'Tiredness, pale skin, dizziness, breathlessness, headaches and cold hands and feet.'],
      ['What can help',   'Iron-rich foods, vitamin C with meals, vitamin B12 and folate foods, and iron tablets only if your doctor prescribes them.'],
      ['Go easy on',      'Tea or coffee with meals, skipping meals and long gaps without food.'],
      ['See a doctor if', 'You faint, have chest pain, a fast heartbeat or severe tiredness, or if you are pregnant.']
    ],
    immunity: [
      ['What it is',      'Immunity is your body’s defence against infections. It can dip with poor food, stress, little sleep or illness.'],
      ['Common signs',    'Catching colds often, slow recovery, frequent tiredness or repeated infections.'],
      ['What can help',   'Colourful fruits and vegetables, protein, enough water, 7–8 hours of sleep, daily movement, yoga and stress control.'],
      ['Go easy on',      'Junk food, too much sugar, smoking, alcohol and late nights.'],
      ['See a doctor if', 'Infections keep returning, you have a high fever, or recovery takes very long.']
    ],
    arthritis: [
      ['What it is',      'Arthritis means pain and stiffness in the joints. Bone health is about keeping bones strong with calcium, vitamin D and movement.'],
      ['Common signs',    'Joint pain, morning stiffness, swelling and reduced movement.'],
      ['What can help',   'Calcium and vitamin D foods, safe morning sunlight, gentle daily movement, a healthy weight and a warm-up before exercise.'],
      ['Go easy on',      'Too much salt and sugar, long hours of sitting, smoking and heavy lifting on painful joints.'],
      ['See a doctor if', 'A joint is hot and swollen, pain is severe, you have a fall or fracture, or pain wakes you at night.']
    ],
    pregnancy: [
      ['What it is',      'Pregnancy and breastfeeding (lactation) need extra nutrients for mother and baby, such as iron, folate, calcium and protein.'],
      ['Common changes',  'Nausea, tiredness, heartburn, cravings, constipation and swelling in the feet.'],
      ['What can help',   'Small regular meals, iron, calcium and protein foods, plenty of fluids, gentle walking and the supplements your doctor prescribes.'],
      ['Go easy on',      'Alcohol, smoking, too much caffeine, raw or undercooked food, unpasteurised milk and skipping meals.'],
      ['See a doctor if', 'You have bleeding, severe pain, a strong headache, swelling of the face or hands, reduced baby movement or any worry at all.']
    ],
    child: [
      ['What it is',      'Children need balanced food and active play for healthy growth, strength and learning.'],
      ['Watch for',       'Poor appetite, weight very low or high for age, tiredness, frequent illness or slow growth.'],
      ['What can help',   'Regular family meals, fruit and vegetables, milk or curd, pulses, outdoor play and enough sleep for their age.'],
      ['Go easy on',      'Chips, sweets, cold drinks, long screen time and forcing a child to eat.'],
      ['See a doctor if', 'Growth is slow, illness keeps returning, picky eating lasts very long or weight changes suddenly.']
    ],
    detox: [
      ['What it is',      'Here, detox means a gentle, food-based reset with more water, fibre and fresh food. Your liver and kidneys already clear waste every day.'],
      ['Common signs',    'Feeling heavy, bloated or low in energy, or eating a lot of packaged and sugary food.'],
      ['What can help',   'Water, vegetables, fruit, whole grains, lemon water, good sleep, daily movement and less processed food.'],
      ['Go easy on',      'Juice-only plans, long fasting, laxatives and detox pills.'],
      ['See a doctor if', 'You feel tired all the time, have stomach pain or yellow eyes or skin, or you have a medical condition or take medicine.']
    ],
    kidney: [
      ['What it is',      'Kidney stones are hard lumps formed from minerals in the urine. They can cause sharp pain.'],
      ['Common signs',    'Sharp pain in the back or side, pain while passing urine, blood in the urine and nausea.'],
      ['What can help',   'Drinking enough water through the day, less salt, a balanced diet and following your doctor’s advice for your stone type.'],
      ['Go easy on',      'Too much salt, too little water, and high-dose supplements such as vitamin C or calcium tablets unless advised.'],
      ['See a doctor if', 'You have severe pain, fever, vomiting, blood in the urine or difficulty passing urine.']
    ],
    cancer: [
      ['What it is',      'Cancer and its treatment can reduce appetite and cause weight loss (malnutrition). Good nutrition helps strength and recovery.'],
      ['Common signs',    'Loss of appetite, unplanned weight loss, weakness, taste changes, nausea or mouth sores.'],
      ['What can help',   'Small frequent meals, protein and energy-rich foods you can manage, plenty of fluids and support from your oncology dietitian.'],
      ['Go easy on',      'Strict diets, unproven “cancer cures”, raw or unhygienic food and skipping meals.'],
      ['Always tell your team', 'Contact your oncology team about weight loss, vomiting, fever or difficulty eating or swallowing.']
    ]
  });


  /* =====================================================================
     HEART & BLOOD SUGAR group: Blood pressure, Hypertension, Hypotension, Diabetes, Blood sugar
     (Hypertension and Blood sugar reuse the Blood pressure and Diabetes content; Hypotension has its own)
     ===================================================================== */
  GOAL.dietitian = { title: 'Ask a Question', icon: 'fa-comments' };

  Object.assign(CONDITION, {
    bp: 'Blood pressure', hypertension: 'Hypertension', hypotension: 'Hypotension',
    diabetes: 'Diabetes', bloodsugar: 'Blood sugar'
  });
  COND_TIPS.hypertension = COND_TIPS.bp;       COND_TIPS.bloodsugar = COND_TIPS.diabetes;
  YOGA.hypertension = YOGA.bp;                 YOGA.bloodsugar = YOGA.diabetes;
  YOGA_CAUTION.hypertension = YOGA_CAUTION.bp; YOGA_CAUTION.bloodsugar = YOGA_CAUTION.diabetes;
  COND_INFO.hypertension = COND_INFO.bp;       COND_INFO.bloodsugar = COND_INFO.diabetes;

  COND_TIPS.hypotension = { diet: 'Drink enough fluids through the day and eat small, regular meals. Do not skip meals, and ask your doctor whether you need a little more salt.' };
  YOGA.hypotension = [
    ['Sukhasana + slow breathing', 'Calms the mind and steadies breathing', '3 min'],
    ['Vajrasana',                  'Seated pose, aids digestion',          '3 min'],
    ['Marjaryasana-Bitilasana',    'Gentle spine movement, done slowly',   '2 min'],
    ['Bhujangasana',               'Opens the chest',                      '1 min'],
    ['Shavasana',                  'Rest, then get up slowly',             '5 min']
  ];
  YOGA_CAUTION.hypotension = 'Move slowly and get up gradually after lying down. Avoid holding poses for long, and stop if you feel dizzy.';
  COND_INFO.hypotension = [
    ['What it is',      'Hypotension means low blood pressure. It can make you feel dizzy, especially when you stand up quickly.'],
    ['Common signs',    'Dizziness, light-headedness, fainting, blurred vision, tiredness or feeling weak.'],
    ['What can help',   'Enough water, small regular meals, getting up slowly, enough sleep and your doctor’s advice about salt.'],
    ['Go easy on',      'Long gaps without food, standing up suddenly, long time in the heat and alcohol.'],
    ['See a doctor if', 'You faint, have chest pain, confusion, very low readings or symptoms that keep coming back.']
  ];

  /* Rough daily energy estimate from weight only (height is not collected). */
  function kcalEstimate(p) {
    if (['pregnancy', 'child', 'cancer'].includes(p.condition)) return null;   // needs differ: follow your doctor or dietitian
    const w = parseFloat(p.weight);
    if (!w) return null;
    const perKg = { sedentary: 28, light: 31, active: 35 }[p.activity] || 31;
    return Math.round((w * perKg) / 50) * 50;
  }

  const DISCLAIMER = 'General guidance only. Please check with your doctor before making big changes.';

  /* ---------- section builders (return the HTML for each goal) ---------- */
  /* NEW: small "at a glance" tiles shown at the top of a section, items = [icon, value, label] */
  const kpis = items => `<div class="cm-kpis">${items.filter(Boolean).map(k =>
    `<div class="cm-kpi"><i class="fa-solid ${k[0]}"></i><div><b>${k[1]}</b><small>${k[2]}</small></div></div>`).join('')}</div>`;

  /* =====================================================================
     7-DAY MENU  (a different menu every day; each day unlocks when the previous day is completed)
     Order of meals: Breakfast, Mid-morning, Lunch, Evening, Dinner
     Edit any text below to match what the dietitian recommends.
     ===================================================================== */
  const MEAL_NAMES = ['Breakfast', 'Mid-morning', 'Lunch', 'Evening', 'Dinner'];
  const MEAL_TIME  = { 'Breakfast': '8:30 AM', 'Mid-morning': '11:00 AM', 'Lunch': '1:30 PM', 'Evening': '5:00 PM', 'Dinner': '8:00 PM' };

  const MENU_THEMES = [
    { theme: 'Fresh start',          tip: 'Start your day with a glass of water before breakfast.' },
    { theme: 'Protein boost',        tip: 'Add a protein source to every meal today.' },
    { theme: 'Light and gentle',     tip: 'Eat slowly and stop when you feel comfortably full.' },
    { theme: 'Green day',            tip: 'Fill half of your plate with vegetables.' },
    { theme: 'Millet day',           tip: 'Millets keep you full for longer. Enjoy them without added sugar.' },
    { theme: 'Comfort and balance',  tip: 'Keep dinner light and finish it 2 hours before sleep.' },
    { theme: 'Relaxed Sunday',       tip: 'Plan next week’s shopping so healthy food is easy to find.' }
  ];

  /* vegetarian base menu */
  const MENU_VEG = [
    /* Day 1 */ ['Vegetable poha with peanuts and 1 cup milk', '1 seasonal fruit and a handful of nuts', '2 rotis, dal, 1 cup sabzi, salad and a bowl of curd', 'Roasted chana and a glass of buttermilk', 'Vegetable khichdi with a small bowl of curd'],
    /* Day 2 */ ['Besan chilla with mint chutney', '1 apple and 5 almonds', '2 rotis, rajma, cucumber and tomato salad', 'Roasted makhana and a glass of buttermilk', 'Paneer bhurji (small portion) with 1–2 rotis and sautéed vegetables'],
    /* Day 3 */ ['Vegetable upma with 1 cup milk', '1 banana or a bowl of papaya', '1 cup brown rice, moong dal, lauki sabzi and salad', 'Sprouts chaat with lemon', 'Vegetable dalia khichdi with a small bowl of curd'],
    /* Day 4 */ ['1 palak paratha with curd', '1 orange or guava', '2 rotis, chana masala (small bowl), bhindi sabzi and salad', 'Cucumber and carrot sticks with a curd dip', 'Palak dal with 1–2 rotis and salad'],
    /* Day 5 */ ['Ragi porridge or ragi dosa with chutney', 'A bowl of pomegranate or any seasonal fruit', '2 jowar or bajra rotis, dal, seasonal sabzi and salad', 'A handful of roasted peanuts and coconut water', 'Vegetable pulao (1 cup) with raita'],
    /* Day 6 */ ['2–3 idlis with sambar and chutney', '1 fruit and a few walnuts', '2 rotis, dal tadka, cabbage or tinda sabzi and salad', 'Sprouts bhel with chopped vegetables', 'Grilled paneer or tofu with salad and 1 roti'],
    /* Day 7 */ ['Vegetable sandwich on brown bread with 1 glass milk', 'Fruit bowl with a few seeds', 'Dal, 2 rotis, a mixed vegetable curry and a bowl of curd', 'Roasted corn or a fruit', 'Moong dal cheela (2) with vegetables and mint chutney']
  ];

  /* non-vegetarian: same menu, with these meals swapped  { dayIndex: { mealIndex: text } } */
  const NONVEG_SWAP = {
    0: { 3: 'A boiled egg and a glass of buttermilk' },
    1: { 4: 'Grilled chicken (small portion) with sautéed vegetables and 1–2 rotis' },
    2: { 0: 'Vegetable omelette (2 eggs) with 1 slice of multigrain toast' },
    3: { 4: 'Fish curry (small portion) with 1–2 rotis and salad' },
    4: { 2: '2 jowar or bajra rotis, dal, egg curry (1–2 eggs) and salad' },
    5: { 4: 'Grilled fish or chicken with salad and 1 roti' },
    6: { 2: 'Chicken or fish curry (small portion), 2 rotis or 1 cup rice, sabzi and salad' }
  };

  /* vegan: same menu with dairy swapped for plant options */
  const veganize = t => t
    .replace(/paneer or tofu/gi, 'tofu').replace(/Paneer/g, 'Tofu').replace(/paneer/g, 'tofu')
    .replace(/buttermilk/g, 'coconut water')
    .replace(/(\d) (cup|glass) milk/g, '$1 $2 soy or other plant milk')
    .replace(/\bcurd\b/g, 'plant-based curd')
    .replace(/raita/g, 'cucumber-onion salad');

  function menuFor(pref) {
    if (pref === 'nonveg') return MENU_VEG.map((d, i) => d.map((t, j) => (NONVEG_SWAP[i] && NONVEG_SWAP[i][j]) || t));
    if (pref === 'vegan')  return MENU_VEG.map(d => d.map(veganize));
    return MENU_VEG;
  }

  const MEAL_ICON = { 'Breakfast': 'fa-mug-hot', 'Mid-morning': 'fa-apple-whole', 'Lunch': 'fa-bowl-rice', 'Evening': 'fa-mug-saucer', 'Dinner': 'fa-moon' };


  /* =====================================================================
     DIETITIAN: small "Ask our dietitian" box (shown only in Diet Plan and Condition Info).
     Fill in the contact options you want to offer; leave '' to hide one.
     With nothing filled in, "Send question" opens your Contact page instead.
     ===================================================================== */
  const DIETITIAN = {
    name: 'Dhanashree Pundkar', role: 'Dietitian', initials: 'DP',
    fullName: 'Mrs. Dhanashri S. Pundkar',
    clinic: 'Aadya Diet Consultancy',
    qualification: 'M.Sc. (Food & Nutrition), NDEP',
    title: 'Clinical Dietitian & Nutritionist',
    currently: 'Dietitian, Sant Tukaram Cancer Hospital, Akola',
    previously: 'Former Dietitian, HCG Manavata Cancer Hospital, Nashik',
    email: 'dhanashripsarap@gmail.com',
    phone: '+919096066204',  phoneShow: '9096 066 204',
    whatsapp: '919096066204',
    card: 'images/dhanashree-pundkar-card.jpg'
  };

  function askHTML(p, topic) {
    const cond = CONDITION[p.condition] || 'general wellness';
    const has = DIETITIAN.whatsapp || DIETITIAN.email || DIETITIAN.phone;
    return `
      <div class="cm-ask" data-topic="${topic}">
        <div class="cm-ask-head"><span class="cm-dav">${DIETITIAN.initials}</span>
          <div><b>Have a question? Ask our dietitian</b><small>${esc(DIETITIAN.name)} · ${esc(DIETITIAN.role)}</small></div></div>
        <textarea class="cm-ask-text" rows="3" maxlength="500" aria-label="Your question"
          placeholder="Type your question for the dietitian"></textarea>
        <div class="cm-ask-actions">
          ${DIETITIAN.whatsapp ? `<button type="button" class="cm-btn small cm-chan" data-ch="wa"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>` : ''}
          ${DIETITIAN.email    ? `<button type="button" class="cm-btn small cm-chan" data-ch="mail"><i class="fa-solid fa-envelope"></i> Email</button>` : ''}
          ${DIETITIAN.phone    ? `<button type="button" class="cm-btn small cm-chan" data-ch="call"><i class="fa-solid fa-phone"></i> Call</button>` : ''}
          ${has ? '' : `<button type="button" class="cm-btn small cm-chan" data-ch="page"><i class="fa-solid fa-paper-plane"></i> Send question</button>`}
        </div>
        <small class="cm-ask-note">We include your name and focus area (${esc(cond)}) so she can help you better.</small>
      </div>`;
  }

  function bindAsk(p) {
    const who = (p.fullName || '').trim() || 'a CareMate user';
    const cond = CONDITION[p.condition] || 'general wellness';
    const message = t => 'Hello ' + DIETITIAN.name + ', this is ' + who + ' from CareMate.\nFocus area: ' + cond + '\n\n' + t;
    document.querySelectorAll('.cm-ask').forEach(box => {
      const ta = box.querySelector('.cm-ask-text');
      box.querySelectorAll('.cm-chan').forEach(btn => btn.addEventListener('click', () => {
        const ch = btn.dataset.ch;
        if (ch === 'call') { window.location.href = 'tel:' + DIETITIAN.phone.replace(/[^\d+]/g, ''); return; }
        const t = ta.value.trim();
        if (t.length < 5) { say('Please type your question first.'); ta.focus(); return; }
        if (ch === 'wa')   window.open('https://wa.me/' + DIETITIAN.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent(message(t)), '_blank', 'noopener');
        if (ch === 'mail') window.location.href = 'mailto:' + DIETITIAN.email + '?subject=' + encodeURIComponent('Question from CareMate') + '&body=' + encodeURIComponent(message(t));
        if (ch === 'page') { say('Opening the Contact page so you can send your question.'); setTimeout(() => { window.location.href = 'index.html#contact'; }, 1200); }
      }));
    });
  }

  /* a short motivational line in the plan banner (changes every day) */
  const QUOTES = [
    'Small steps every day lead to big changes.',
    'Progress, not perfection. One healthy meal at a time.',
    'Be kind to your body. It carries you through everything.',
    'Consistency beats intensity. Show up today.',
    'Every healthy choice is a step towards a stronger you.',
    'Rest is part of the plan too. Listen to your body.',
    'You do not have to be perfect. Just keep going.',
    'Eat well, move gently, sleep deeply, smile often.',
    'Your health is an investment, not an expense.',
    'Today is a good day to start.'
  ];
  const todayQuote = () => QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

  const BUILD = {
    /* Diet: 7 daily menus. Day 1 is open; finishing all 5 meals unlocks the next day (see bindDiet) */
    diet(p) {
      const tip = (COND_TIPS[p.condition] || {}).diet;
      const kcal = kcalEstimate(p);
      return {
        desc: `${FOODPREF[p.foodPref] || 'Balanced'} · a new menu unlocks every day${kcal ? ' · about ' + kcal.toLocaleString('en-IN') + ' kcal (rough estimate)' : ''}`,
        html: `
          ${kpis([
            kcal ? ['fa-fire-flame-curved', '~' + kcal.toLocaleString('en-IN'), 'kcal a day (estimate)'] : null,
            ['fa-droplet', '2.5–3 L', 'Water a day'],
            ['fa-calendar-days', '7 days', 'A new menu unlocks daily']
          ])}
          <div class="cm-journey">
            <div class="cm-ring" id="cmRing"><b id="cmRingTxt">0/7</b></div>
            <div class="cm-jtext"><b id="cmJTitle"></b><small id="cmJSub"></small></div>
            <button type="button" class="cm-link" id="cmRestart">Restart</button>
          </div>
          <div class="cm-days" id="cmDays" role="tablist" aria-label="Your 7-day menu"></div>
          <div class="cm-dayhead" id="cmDayHead"></div>
          <div id="cmMeals"></div>
          <div class="cm-meter" id="cmMealMeter"><i id="cmMealFill"></i></div>
          <div class="cm-meter-label" id="cmMealLabel"></div>
          <p class="cm-note" id="cmDayTip"></p>
          <div class="cm-next" id="cmNext"></div>
          <p class="cm-note">Drink 2.5–3 litres of water a day. Keep fried and sugary food to once or twice a week.</p>
          ${tip ? `<p class="cm-note"><b>For ${esc(CONDITION[p.condition])}:</b> ${tip}</p>` : ''}
          ${p.notes ? `<p class="cm-note"><b>You told us:</b> ${esc(p.notes)}. Please skip any food you are allergic to or avoid.</p>` : ''}
          <p class="cm-note cm-disc">${DISCLAIMER}</p>`
      };
    },

    /* CHANGED: was exercise(p). Now a yoga routine based on the selected condition. */
    yoga(p) {
      const rows = YOGA[p.condition] || YOGA.general;
      const caution = YOGA_CAUTION[p.condition];
      return {
        desc: `${CONDITION[p.condition] || 'General wellness'} friendly routine · about 20–30 min a day`,
        html: `
          ${kpis([
            ['fa-clock', '20–30 min', 'Per day'],
            ['fa-list-ol', String(rows.length), 'Poses in your routine'],
            ['fa-sun', 'Empty stomach', 'Or 3 hours after a meal']
          ])}
          <table class="cm-table cm-t3">
            <tr><th>Pose</th><th>Benefit</th><th>Time</th></tr>
            ${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
          </table>
          <p class="cm-note">Practise on an empty stomach or 3 hours after a meal. Stop if you feel pain or dizziness.</p>
          ${caution ? `<p class="cm-note"><b>For ${esc(CONDITION[p.condition])}:</b> ${caution}</p>` : ''}
          <p class="cm-note cm-disc">${DISCLAIMER}</p>
          <p class="cm-note cm-motive">Even 10 minutes of yoga today is a win. Be proud of showing up.</p>`
      };
    },

    meditation() {
      return {
        desc: '15 minutes a day',
        html: `
          ${kpis([['fa-clock', '15 min', 'Per day'], ['fa-list-check', '3', 'Short practices']])}
          <div class="cm-row"><div>Morning breathing<small>Anulom Vilom</small></div><b>5 min</b></div>
          <div class="cm-row"><div>Guided meditation<small>Sit quietly and follow your breath</small></div><b>5 min</b></div>
          <div class="cm-row"><div>Evening wind-down<small>Gratitude journal or slow stretching</small></div><b>5 min</b></div>
          <p class="cm-note">Short and regular works better than long and occasional.</p>
          <p class="cm-note cm-motive">Breathe in calm, breathe out stress. Even 5 quiet minutes can change your day.</p>`
      };
    },

    tracking(p) {
      const readings = [];
      if (p.weight) readings.push(`<div class="cm-row"><div>Weight<small>Starting point from your profile</small></div><b>${esc(p.weight)} kg</b></div>`);
      if (p.bp && p.bp.systolic && p.bp.diastolic)
        readings.push(`<div class="cm-row"><div>Blood pressure<small>Logged on your profile</small></div><b>${esc(p.bp.systolic)}/${esc(p.bp.diastolic)} mmHg</b></div>`);
      if (p.sugar && p.sugar.level) {
        const t = { fasting: 'Fasting', post_meal: 'Post-meal', random: 'Random' }[p.sugar.type];
        readings.push(`<div class="cm-row"><div>Blood sugar${t ? ' · ' + t : ''}<small>Logged on your profile</small></div><b>${esc(p.sugar.level)} mg/dL</b></div>`);
      }
      return {
        desc: "Today's checklist",
        html: `
          ${kpis([['fa-list-check', '5', 'Daily check-ins'], ['fa-droplet', '8+', 'Glasses of water']])}
          <ul class="cm-list" id="cmChecklist">
            ${['Ate all planned meals', 'Drank 8 or more glasses of water', "Completed today's yoga", 'Took 15 minutes of calm time', 'Slept 7–8 hours']
              .map((t, i) => `<li><input class="cm-check" type="checkbox" id="cmc${i}"><label for="cmc${i}">${t}</label></li>`).join('')}
          </ul>
          <div class="cm-meter"><i id="cmMeterFill"></i></div>
          <div class="cm-meter-label" id="cmMeterLabel"></div>
          ${readings.length ? `<h3 class="cm-sub-h">Your starting numbers</h3>${readings.join('')}
            <p class="cm-note">Share your readings with your doctor. CareMate does not interpret them.</p>` : ''}
          <p class="cm-note cm-motive">Consistency beats perfection. Every tick you make today counts.</p>`
      };
    },

    reminders() {
      return {
        desc: 'Set your own times, add new ones or delete any',
        html: `
          <div id="cmRemList"></div>
          <form class="cm-radd" id="cmRemAdd" autocomplete="off">
            <input type="text" id="cmRemLabel" placeholder="New reminder, e.g. Take a walk" maxlength="40" aria-label="Reminder name" required>
            <input type="time" id="cmRemTime" value="09:00" aria-label="Reminder time" required>
            <button class="cm-btn small" type="submit">Add</button>
          </form>
          <p class="cm-note">Reminders alert you while this page is open. Allow notifications when asked.</p>
          <p class="cm-note cm-motive">Small reminders build big habits.</p>`
      };
    },

    /* CHANGED: was coach(p). Now written info about the condition chosen on the form. */
    /* Ask a Question: always the last area in "Your areas" (no dietitian profile here, just the message box) */
    dietitian(p) {
      return {
        desc: 'Message our dietitian',
        html: `
          <p class="cm-note cm-motive">Not sure about a food, a swap or your routine? Just ask. Our dietitian, ${esc(DIETITIAN.name)}, is here to help.</p>
          ${askHTML(p, 'dietitian')}
          <p class="cm-note cm-disc">${DISCLAIMER}</p>`
      };
    },

    info(p) {
      const rows = COND_INFO[p.condition] || COND_INFO.general;
      return {
        desc: `About ${CONDITION[p.condition] || 'general wellness'}`,
        html: `
          <table class="cm-table cm-kv">
            ${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}
          </table>
          <p class="cm-note cm-motive">Understanding your health is the first step to looking after it. You are doing great by learning more.</p>
          <p class="cm-note cm-disc">This is general education only and cannot diagnose anything. Please check with your doctor.</p>`
      };
    }
  };

  /* ---------- videos: YOUR OWN files (no YouTube) ----------
     src    = path to your video file, e.g. 'videos/diet-1.mp4'  (leave '' if not ready yet)
     poster = optional thumbnail image, e.g. 'videos/posters/diet-1.jpg'
     Put all video files in a "videos" folder next to profile.html.                         */
  const VIDEOS = {
    diet: [
      { title: 'Balanced plate guide',    by: 'Diet Plan', src: 'videos/diet-1.mp4', poster: '' },
      { title: 'Healthy breakfast ideas', by: 'Diet Plan', src: 'videos/diet-2.mp4', poster: '' }
    ],
    yoga: [
      { title: 'Yoga for beginners',      by: 'Yoga', src: 'videos/yoga-1.mp4', poster: '' },
      { title: 'Surya Namaskar',          by: 'Yoga', src: 'videos/yoga-2.mp4', poster: '' }
    ],
    meditation: [
      { title: 'Anulom Vilom breathing',  by: 'Meditation', src: 'videos/meditation-1.mp4', poster: '' },
      { title: 'Guided meditation',       by: 'Meditation', src: 'videos/meditation-2.mp4', poster: '' }
    ]
  };

  /* Condition Info videos: chosen by the condition selected on the form */
  const INFO_VIDEOS = {
    pcod:        [{ title: 'Understanding PCOD',           by: 'Condition Info', src: 'videos/info-pcod-1.mp4',        poster: '' },
                  { title: 'PCOD daily habits',            by: 'Condition Info', src: 'videos/info-pcod-2.mp4',        poster: '' }],
    pcos:        [{ title: 'Understanding PCOS',           by: 'Condition Info', src: 'videos/info-pcos-1.mp4',        poster: '' },
                  { title: 'PCOS daily habits',            by: 'Condition Info', src: 'videos/info-pcos-2.mp4',        poster: '' }],
    ibd:         [{ title: 'Understanding IBD',            by: 'Condition Info', src: 'videos/info-ibd-1.mp4',         poster: '' },
                  { title: 'Eating well with IBD',         by: 'Condition Info', src: 'videos/info-ibd-2.mp4',         poster: '' }],
    diabetes:    [{ title: 'Understanding diabetes',       by: 'Condition Info', src: 'videos/info-diabetes-1.mp4',    poster: '' },
                  { title: 'Diabetes daily habits',        by: 'Condition Info', src: 'videos/info-diabetes-2.mp4',    poster: '' }],
    bp:          [{ title: 'Understanding blood pressure', by: 'Condition Info', src: 'videos/info-bp-1.mp4',          poster: '' },
                  { title: 'Blood pressure daily habits',  by: 'Condition Info', src: 'videos/info-bp-2.mp4',          poster: '' }],
    obesity:     [{ title: 'Understanding obesity',        by: 'Condition Info', src: 'videos/info-obesity-1.mp4',     poster: '' },
                  { title: 'Healthy weight tips',          by: 'Condition Info', src: 'videos/info-obesity-2.mp4',     poster: '' }],
    underweight: [{ title: 'Understanding under weight',   by: 'Condition Info', src: 'videos/info-underweight-1.mp4', poster: '' },
                  { title: 'Healthy weight gain tips',     by: 'Condition Info', src: 'videos/info-underweight-2.mp4', poster: '' }],
    general:     [{ title: 'Daily wellness habits',        by: 'Condition Info', src: 'videos/info-general-1.mp4',     poster: '' },
                  { title: 'Sleep, stress and health',     by: 'Condition Info', src: 'videos/info-general-2.mp4',     poster: '' }]
  };

  /* videos for the added conditions: put your files in the videos folder with these names */
  (function () {
    const mk = (key, name) => [
      { title: 'Understanding ' + name, by: 'Condition Info', src: 'videos/info-' + key + '-1.mp4', poster: '' },
      { title: name + ': daily habits', by: 'Condition Info', src: 'videos/info-' + key + '-2.mp4', poster: '' }
    ];
    INFO_VIDEOS.htndm     = mk('htndm', 'hypertension and diabetes');
    INFO_VIDEOS.thyroid   = mk('thyroid', 'thyroid health');
    INFO_VIDEOS.anaemia   = mk('anaemia', 'anaemia');
    INFO_VIDEOS.immunity  = mk('immunity', 'low immunity');
    INFO_VIDEOS.arthritis = mk('arthritis', 'arthritis and bone health');
    INFO_VIDEOS.pregnancy = mk('pregnancy', 'pregnancy and lactation');
    INFO_VIDEOS.child     = mk('child', 'child health');
    INFO_VIDEOS.detox     = mk('detox', 'gentle detox');
    INFO_VIDEOS.kidney    = mk('kidney', 'kidney stones');
    INFO_VIDEOS.cancer    = mk('cancer', 'nutrition during cancer care');
    INFO_VIDEOS.hypotension  = mk('hypotension', 'low blood pressure');
    INFO_VIDEOS.hypertension = INFO_VIDEOS.bp;          // same videos as Blood pressure
    INFO_VIDEOS.bloodsugar   = INFO_VIDEOS.diabetes;    // same videos as Diabetes
  })();

  /* Picks the right video list. "info" depends on the selected condition. */
  let currentCondition = 'general';
  function videoList(sec) {
    return sec === 'info' ? (INFO_VIDEOS[currentCondition] || INFO_VIDEOS.general) : VIDEOS[sec];
  }

  /* CHANGED: builds a normal <video> player for each of your own files */
  function videosHTML(sec) {
    const list = videoList(sec);
    if (!list || !list.length) return '';
    const cards = list.map(v => {
      const player = v.src
        ? `<video class="cm-video" controls preload="metadata" playsinline ${v.poster ? `poster="${esc(v.poster)}"` : ''}>
             <source src="${esc(v.src)}" type="video/mp4">
             Your browser does not support video playback.
           </video>`
        : `<div class="cm-video cm-video-empty"><i class="fa-solid fa-film"></i><span>Video coming soon</span></div>`;
      return `<div class="cm-vbox">${player}
        <div class="cm-vtitle">${esc(v.title)}</div><div class="cm-vsub">${esc(v.by)}</div></div>`;
    }).join('');
    return `<div class="cm-videos"><h3>Watch and learn</h3><p>Short videos for this section.</p><div class="cm-vgrid">${cards}</div></div>`;
  }

  /* CHANGED: only one video plays at a time */
  function bindVideos() {
    const vids = [...document.querySelectorAll('.cm-video')];
    vids.forEach(v => v.addEventListener('play', () => {
      vids.forEach(o => { if (o !== v && o.pause) o.pause(); });
    }));
  }

  /* ---------- toast ---------- */
  function say(msg) {
    const t = $('cmToast'); t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- tracking checklist (saved per day) ---------- */
  function bindChecklist() {
    const boxes = [...document.querySelectorAll('#cmChecklist .cm-check')];
    if (!boxes.length) return;
    const key = 'careMateChecks_' + new Date().toISOString().slice(0, 10);
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
    const update = () => {
      const done = boxes.filter(b => b.checked).length;
      $('cmMeterFill').style.width = (done / boxes.length * 100) + '%';
      $('cmMeterLabel').textContent = done + ' of ' + boxes.length + ' done today';
      try { localStorage.setItem(key, JSON.stringify(boxes.map(b => b.checked))); } catch (e) {}
    };
    boxes.forEach((b, i) => { b.checked = !!saved[i]; b.addEventListener('change', update); });
    update();
  }

  /* ---------- editable reminders ---------- */
  const DEFAULT_REMINDERS = [
    { label: 'Drink water', time: '10:00', on: true },
    { label: 'Breakfast',   time: '08:30', on: true },
    { label: 'Lunch',       time: '13:30', on: true },
    { label: 'Dinner',      time: '20:00', on: true },
    { label: 'Yoga',        time: '06:30', on: true },     // CHANGED (was Workout)
    { label: 'Meditation',  time: '21:30', on: false }
  ];
  let reminders = null;
  try { reminders = JSON.parse(localStorage.getItem('careMateReminders') || 'null'); } catch (e) {}
  if (!Array.isArray(reminders)) reminders = DEFAULT_REMINDERS.map(r => ({ ...r }));
  const saveRem = () => { try { localStorage.setItem('careMateReminders', JSON.stringify(reminders)); } catch (e) {} };

  function askNotify() {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }

  function drawReminders() {
    const box = $('cmRemList'); if (!box) return;
    reminders.sort((a, b) => a.time.localeCompare(b.time));
    box.innerHTML = reminders.length ? reminders.map((r, i) => `
      <div class="cm-rrow ${r.on ? '' : 'off'}">
        <input type="time" value="${esc(r.time)}" data-i="${i}" data-f="time" aria-label="Time for ${esc(r.label)}">
        <input type="text" value="${esc(r.label)}" data-i="${i}" data-f="label" maxlength="40" aria-label="Reminder name">
        <label class="cm-switch"><input type="checkbox" ${r.on ? 'checked' : ''} data-i="${i}" data-f="on" aria-label="Turn ${esc(r.label)} on or off"><span></span></label>
        <button type="button" class="cm-del" data-i="${i}" aria-label="Delete ${esc(r.label)}"><i class="fa-solid fa-trash"></i></button>
      </div>`).join('') : '<div class="cm-empty-r">No reminders yet. Add one below.</div>';

    box.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', () => {
      const r = reminders[inp.dataset.i], f = inp.dataset.f;
      r[f] = f === 'on' ? inp.checked : (inp.value || r[f]);
      if (f === 'on' && inp.checked) askNotify();
      saveRem(); drawReminders();
    }));
    box.querySelectorAll('.cm-del').forEach(btn => btn.addEventListener('click', () => {
      reminders.splice(btn.dataset.i, 1); saveRem(); drawReminders();
    }));
  }

  function bindReminders() {
    drawReminders();
    const form = $('cmRemAdd'); if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const label = $('cmRemLabel').value.trim(), time = $('cmRemTime').value;
      if (!label || !time) return;
      reminders.push({ label, time, on: true });
      $('cmRemLabel').value = ''; askNotify(); saveRem(); drawReminders();
    });
  }

  let lastFired = '';
  setInterval(() => {                       // fires alarms while the page is open
    const d = new Date();
    const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (hm === lastFired) return;
    const due = reminders.filter(r => r.on && r.time === hm);
    if (!due.length) return;
    lastFired = hm;
    due.forEach(r => {
      say('Reminder: ' + r.label);
      if ('Notification' in window && Notification.permission === 'granted') new Notification('CareMate', { body: r.label });
    });
  }, 15000);

  /* ---------- page states ---------- */
  function showTab(id) {
    document.querySelectorAll('.cm-tab').forEach(b => b.setAttribute('aria-selected', b.dataset.id === id));
    document.querySelectorAll('.cm-sec').forEach(s => s.hidden = s.dataset.id !== id);
  }


  /* ---------- Diet: days unlock one by one ----------
     Day 1 is open. Tick all 5 meals of a day and the next day unlocks.
     Progress is saved on this device (per "week"; Restart or "Start next week" begins a fresh week). */
  function bindDiet(p) {
    const menu = menuFor(p.foodPref);
    const ls = {
      get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    };
    let week = parseInt(ls.get('careMateWeek'), 10) || 1;
    const doneKey = () => 'careMateDone_w' + week;
    const tickKey = d => 'careMateMeals_w' + week + '_d' + d;
    const doneCount = () => Math.min(7, Math.max(0, parseInt(ls.get(doneKey()), 10) || 0));
    const getTicks = d => {
      try { const a = JSON.parse(ls.get(tickKey(d)) || '[]'); return MEAL_NAMES.map((_, i) => !!a[i]); }
      catch (e) { return MEAL_NAMES.map(() => false); }
    };

    let sel = Math.min(doneCount() + 1, 7);      // open on the day the user is up to
    let justUnlocked = false;                    // true right after a day is completed (shows the celebration)

    const days = $('cmDays');

    function drawJourney() {
      const n = doneCount();
      $('cmRing').style.setProperty('--p', Math.round(n / 7 * 100));
      $('cmRingTxt').textContent = n + '/7';
      $('cmJTitle').textContent = n === 7 ? 'Week complete!' : 'Day ' + (n + 1) + ' is open';
      $('cmJSub').textContent = n === 7
        ? 'You finished all 7 menus. Great consistency!'
        : n + ' of 7 days complete · finish all 5 meals to unlock ' + (n === 6 ? 'your finish line' : 'Day ' + (n + 2));
      days.innerHTML = menu.map((_, i) => {
        const d = i + 1, state = d <= n ? 'done' : d === n + 1 ? 'current' : 'locked';
        const mark = state === 'done' ? '<i class="fa-solid fa-check"></i>' : state === 'locked' ? '<i class="fa-solid fa-lock"></i>' : 'Now';
        return `<button type="button" class="cm-day ${state}${d === sel ? ' on' : ''}" role="tab" data-d="${d}" aria-selected="${d === sel}"
          aria-label="Day ${d}, ${state === 'done' ? 'completed' : state === 'current' ? 'open' : 'locked'}"><small>Day</small><b>${d}</b><em>${mark}</em></button>`;
      }).join('');
    }

    function drawPanel() {
      const n = doneCount(), th = MENU_THEMES[sel - 1];
      const state = sel <= n ? 'done' : sel === n + 1 ? 'current' : 'locked';
      const label = { done: ['fa-circle-check', 'Completed'], current: ['fa-utensils', 'In progress'], locked: ['fa-lock', 'Locked'] }[state];
      const sub = { done: 'You completed this day. Nice work!', current: 'Tick each meal as you eat it.', locked: 'Complete Day ' + (n + 1) + ' to unlock this menu.' }[state];

      $('cmDayHead').innerHTML = `<div><h3>Day ${sel} · ${th.theme}</h3><p>${sub}</p></div>
        <span class="cm-status s-${state}"><i class="fa-solid ${label[0]}"></i> ${label[1]}</span>`;

      const showMeter = state !== 'locked';
      $('cmMealMeter').style.display = showMeter ? '' : 'none';
      $('cmMealLabel').style.display = showMeter ? '' : 'none';
      $('cmDayTip').style.display    = showMeter ? '' : 'none';

      if (state === 'locked') {                 // locked: show only the theme and blurred placeholders
        $('cmMeals').innerHTML = `
          <div class="cm-locked">
            <div class="cm-lock-ico"><i class="fa-solid fa-lock"></i></div>
            <h4>Day ${sel} is locked</h4>
            <p>Finish all 5 meals of Day ${n + 1} to unlock “${th.theme}”. Good things take one day at a time.</p>
            <button type="button" class="cm-btn small" id="cmGoCurrent">Go to Day ${n + 1}</button>
          </div>` + MEAL_NAMES.map(name => `
          <div class="cm-meal ghost"><span class="cm-mico"><i class="fa-solid ${MEAL_ICON[name]}"></i></span>
            <span class="cm-mtext"><small>${name} · ${MEAL_TIME[name]}</small><b class="cm-blur">Menu unlocks soon</b></span>
            <span class="cm-tick"><i class="fa-solid fa-lock"></i></span></div>`).join('');
      } else {
        const ticks = getTicks(sel), readonly = state === 'done';
        $('cmMeals').innerHTML = menu[sel - 1].map((t, i) => `
          <label class="cm-meal${ticks[i] || readonly ? ' done' : ''}${readonly ? ' readonly' : ''}">
            <span class="cm-mico"><i class="fa-solid ${MEAL_ICON[MEAL_NAMES[i]]}"></i></span>
            <span class="cm-mtext"><small>${MEAL_NAMES[i]} · ${MEAL_TIME[MEAL_NAMES[i]]}</small><b>${esc(t)}</b></span>
            <input type="checkbox" class="cm-mcheck" data-i="${i}" ${ticks[i] || readonly ? 'checked' : ''} ${readonly ? 'disabled' : ''} aria-label="Mark ${MEAL_NAMES[i]} as done">
            <span class="cm-tick"><i class="fa-solid fa-check"></i></span>
          </label>`).join('');
        $('cmDayTip').innerHTML = `<b>Tip for Day ${sel}:</b> ${esc(th.tip)}`;
        progress();
        if (state === 'current' && ticks.every(Boolean)) { completeDay(); return; }   // all meals were already ticked
      }
      drawNext(state);
      bindPanel();
    }

    function progress() {
      const boxes = [...document.querySelectorAll('.cm-mcheck')];
      if (!boxes.length) return;
      const done = boxes.filter(b => b.checked).length;
      $('cmMealFill').style.width = (done / boxes.length * 100) + '%';
      $('cmMealLabel').textContent = done === boxes.length ? 'All 5 meals done. Well done!' : done + ' of ' + boxes.length + ' meals done';
    }

    function drawNext(state) {
      const n = doneCount(), box = $('cmNext');
      box.className = 'cm-next';
      if (n === 7) {                             // whole week finished
        box.classList.add('win');
        box.innerHTML = `<i class="cm-spark"></i>`.repeat(10) + `
          <span class="cm-nx-ico"><i class="fa-solid fa-trophy"></i></span>
          <div><small>Week ${week} complete</small><b>You unlocked all 7 days!</b><span>Amazing consistency! Ready for a fresh week of menus?</span></div>
          <button type="button" class="cm-tm-btn" id="cmNextWeek">Start week ${week + 1}</button>`;
        return;
      }
      if (justUnlocked && state === 'done') {     // just finished a day: celebrate and offer the new day
        box.classList.add('win');
        box.innerHTML = `<i class="cm-spark"></i>`.repeat(10) + `
          <span class="cm-nx-ico"><i class="fa-solid fa-trophy"></i></span>
          <div><small>Day ${n} complete</small><b>Day ${n + 1} unlocked · ${MENU_THEMES[n].theme}</b><span>Well done! Small steps every day lead to big changes.</span></div>
          <button type="button" class="cm-tm-btn" id="cmOpenNext">Open Day ${n + 1}</button>`;
        return;
      }
      if (state === 'current') {                  // teaser for the day that is still locked
        box.innerHTML = `
          <span class="cm-nx-ico"><i class="fa-solid fa-lock"></i></span>
          <div><small>Up next · Day ${n + 2}</small><b>${n === 6 ? 'Finish the week' : MENU_THEMES[n + 1].theme}</b>
            <span>${n === 6 ? 'Complete today’s meals to finish your 7-day journey.' : 'Complete all 5 meals today to unlock it.'}</span></div>`;
        return;
      }
      if (state === 'done' && n < 7) {            // looking back at an older day
        box.innerHTML = `
          <span class="cm-nx-ico"><i class="fa-solid fa-circle-arrow-right"></i></span>
          <div><small>Continue</small><b>Day ${n + 1} · ${MENU_THEMES[n].theme}</b><span>Pick up where you left off.</span></div>
          <button type="button" class="cm-btn small" id="cmOpenNext">Open Day ${n + 1}</button>`;
        return;
      }
      box.innerHTML = '';
    }

    function bindPanel() {
      document.querySelectorAll('.cm-mcheck:not(:disabled)').forEach(c => c.addEventListener('change', () => {
        const arr = [...document.querySelectorAll('.cm-mcheck')].map(x => x.checked);
        ls.set(tickKey(sel), JSON.stringify(arr));
        c.closest('.cm-meal').classList.toggle('done', c.checked);
        progress();
        if (arr.every(Boolean) && sel === doneCount() + 1) completeDay();
      }));
      const go = $('cmGoCurrent'); if (go) go.addEventListener('click', () => { sel = doneCount() + 1; justUnlocked = false; drawAll(); });
      const open = $('cmOpenNext'); if (open) open.addEventListener('click', () => { sel = Math.min(doneCount() + 1, 7); justUnlocked = false; drawAll(); });
      const nw = $('cmNextWeek'); if (nw) nw.addEventListener('click', () => { week += 1; ls.set('careMateWeek', week); sel = 1; justUnlocked = false; drawAll(); say('Week ' + week + ' started'); });
    }

    function completeDay() {
      const n = doneCount() + 1;
      ls.set(doneKey(), n);
      justUnlocked = true;
      drawAll();
      say(n === 7 ? 'Week complete! Amazing work.' : 'Day ' + n + ' complete! Day ' + (n + 1) + ' unlocked.');
    }

    function drawAll() { drawJourney(); drawPanel(); }

    days.addEventListener('click', e => {
      const b = e.target.closest('.cm-day'); if (!b) return;
      const d = +b.dataset.d;
      if (d !== sel) justUnlocked = false;
      sel = d;
      drawAll();
      if (d > doneCount() + 1) say('Complete Day ' + (doneCount() + 1) + ' to unlock Day ' + d);
    });

    $('cmRestart').addEventListener('click', () => {
      if (!confirm('Restart your 7-day menu from Day 1?')) return;
      week += 1; ls.set('careMateWeek', week); sel = 1; justUnlocked = false; drawAll(); say('Menu restarted from Day 1');
    });

    drawAll();
  }

  function render(p, goals) {
    currentCondition = p.condition;      // NEW: tells videoList() which condition videos to use
    const first = (p.fullName || '').trim().split(' ')[0];
    const stats = [
      ['Age', p.age ? esc(p.age) + ' years' : ''],
      ['Weight', p.weight ? esc(p.weight) + ' kg' : ''],
      ['Activity', ACTIVITY[p.activity]],
      ['Food', FOODPREF[p.foodPref]],
      ['Focus', CONDITION[p.condition]]
    ].filter(s => s[1]);

    const areas = goals.concat('dietitian');      // "Ask a Question" is always available
    const sections = areas.map((id, i) => {
      const out = BUILD[id](p);
      const prev = areas[i - 1], next = areas[i + 1];
      const pager = areas.length < 2 ? '' : `
          <div class="cm-pager">
            ${prev ? `<button type="button" class="cm-pg" data-go="${prev}"><i class="fa-solid fa-arrow-left"></i> ${GOAL[prev].title}</button>` : '<span></span>'}
            ${next ? `<button type="button" class="cm-pg next" data-go="${next}">${GOAL[next].title} <i class="fa-solid fa-arrow-right"></i></button>` : '<span></span>'}
          </div>`;
      return `
        <section class="cm-sec" data-id="${id}" role="tabpanel" aria-labelledby="cmh-${id}" hidden>
          <div class="cm-sec-head">
            <div class="cm-ico"><i class="fa-solid ${GOAL[id].icon}"></i></div>
            <div><h2 id="cmh-${id}">${GOAL[id].title}</h2><p>${out.desc}</p></div>
          </div>
          <div class="cm-body">${out.html}${videosHTML(id)}</div>${pager}
        </section>`;
    }).join('');

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const tabs = areas.map(id => `<button type="button" role="tab" class="cm-tab" data-id="${id}" aria-selected="false">
        <span class="cm-tico"><i class="fa-solid ${GOAL[id].icon}"></i></span><span class="cm-tlabel">${GOAL[id].title}</span><i class="fa-solid fa-chevron-right cm-tchev"></i></button>`).join('');

    $('cmCard').innerHTML = `
      <div class="cm-banner">
        <div class="cm-bn-text">
          <span class="cm-eyebrow"><i class="fa-solid fa-leaf"></i> Your personalised plan</span>
          <h1>${first ? 'Hello, ' + esc(first) : 'Your plan'}</h1>
          <p class="cm-sub">${today} · ${goals.length} ${goals.length === 1 ? 'area' : 'areas'} selected</p>
          <p class="cm-quote"><i class="fa-solid fa-quote-left"></i> ${esc(todayQuote())}</p>
        </div>
        <div class="cm-bn-chips">${stats.map(s => `<span class="cm-chip"><small>${s[0]}</small><b>${s[1]}</b></span>`).join('')}</div>
      </div>

      <div class="cm-layout">
        <aside class="cm-nav">
          <p class="cm-nav-h">Your areas</p>
          <div class="cm-tabs" role="tablist" aria-label="Selected areas">${tabs}</div>
        </aside>
        <div class="cm-main">${sections}</div>
      </div>

      <div class="cm-actions">
        <button class="cm-btn ghost" type="button" id="cmEdit"><i class="fa-solid fa-arrow-left"></i> Edit my profile</button>
        <button class="cm-btn primary" type="button" id="cmSave"><i class="fa-solid fa-bookmark"></i> Save my plan</button>
      </div>
      <p class="cm-legal">CareMate gives general wellness guidance. It does not diagnose conditions or replace a doctor or dietitian.</p>`;

    const toTop = () => $('cmCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.cm-tab').forEach(b => b.addEventListener('click', () => {
      showTab(b.dataset.id);
      if (window.innerWidth <= 900) toTop();            // phones: bring the opened area into view
    }));
    document.querySelectorAll('.cm-pg').forEach(b => b.addEventListener('click', () => { showTab(b.dataset.go); toTop(); }));
    $('cmEdit').addEventListener('click', hide);
    $('cmSave').addEventListener('click', () => {
      try { localStorage.setItem('careMatePlan', JSON.stringify({ savedAt: new Date().toISOString(), goals })); } catch (e) {}
      // TODO: send to backend once ready:
      // fetch('/api/plan', { method: 'POST', body: JSON.stringify({ profile: p, goals }) })
      say('Plan saved');
    });

    showTab(goals[0]);          // first selected area is visible by default
    bindChecklist();
    bindVideos();
    bindReminders();
    bindAsk(p);
    if (goals.includes('diet')) bindDiet(p);
  }

  /* ---------- header text + switching between the form and the plan ---------- */
  function setStep(text) {
    const s = document.querySelector('.step-indicator');
    if (s) s.textContent = text;
    const bar = document.querySelector('#pfBar');                       // header progress bar
    if (bar) bar.style.width = /Step 3/.test(text) ? '100%' : '66%';
  }

  /* Called by the "Get my plan" button. Returns true when the plan is shown. */
  function show(p) {
    const goals = ORDER.filter(id => (p.goals || []).includes(id));      // only what the user ticked
    if (!goals.length) {
      say('Please choose at least one area under “What would you like help with?”');
      return false;
    }
    render(p, goals);
    document.querySelector('.form-card').hidden = true;
    $('cmCard').hidden = false;
    setStep('Step 3 of 3 · Your plan');
    window.scrollTo({ top: 0 });
    return true;
  }

  /* "Edit my profile": back to the form, all answers still filled in */
  function hide() {
    $('cmCard').hidden = true;
    document.querySelector('.form-card').hidden = false;
    setStep('Step 2 of 3 · Health profile');
    window.scrollTo({ top: 0 });
  }

  return { show, hide, say };

})();


/* =====================================================================
   CareMate · Home / About / Contact behaviour
   Wrapped so it does nothing on pages that don't have these sections (e.g. profile page).
   ===================================================================== */
(function () {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!$('#home')) return;                       // not the home page
  document.documentElement.classList.add('hp-js');

  /* ---------- 0) header turns solid after scrolling so the menu never overlaps content ---------- */
  const hdr = $('header');
  const topBtn = $('#hpTop');
  const onScroll = () => {
    if (hdr) hdr.classList.toggle('hp-scrolled', window.scrollY > 30);
    if (topBtn) topBtn.hidden = window.scrollY < 600;                 // back-to-top appears after scrolling
  };
  if (topBtn) topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 1) buttons open your existing login / register box ---------- */
  function openAuth(which) {
    const box = $('.cover_box'), lf = $('.form-box.login'), rf = $('.form-box.register');
    if (!box) return;
    box.classList.add('active');
    if (lf && rf) { lf.classList.toggle('active', which === 'login'); rf.classList.toggle('active', which === 'register'); }
  }
  $$('[data-open-login]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); openAuth('login'); }));
  $$('[data-open-register]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); openAuth('register'); }));

  /* ---------- 2) close the mobile menu after tapping a link ---------- */
  $$('header nav a[href^="#"]').forEach(a => a.addEventListener('click', () => {
    const t = $('#check'); if (t) t.checked = false;
  }));

  /* ---------- 3) scroll-reveal ---------- */
  const reveals = $$('.hp-reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* ---------- 4) number count-up (data-count="7") ---------- */
  function countUp(el) {
    const end = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = end + suffix; return; }
    const t0 = performance.now(), dur = 1200;
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;   // ease-out
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(el => co.observe(el));
  } else {
    counters.forEach(countUp);
  }

  /* ---------- 5) "Start your plan" card: pick a focus, then continue to register ----------
     The chosen focus is remembered, and the profile page pre-selects it (see the last block). */
  const chips = $$('.hp-chip'), startBtn = $('#hpStartBtn');
  chips.forEach(chip => chip.addEventListener('click', () => {
    const on = !chip.classList.contains('active');
    chips.forEach(c => c.classList.remove('active'));
    try {
      if (on) { chip.classList.add('active'); localStorage.setItem('careMateInterest', chip.dataset.c); }
      else    { localStorage.removeItem('careMateInterest'); }
    } catch (e) {}
    if (startBtn) startBtn.innerHTML = (on ? 'Continue with ' + chip.dataset.label : 'Create account') + ' <i class="fa-solid fa-arrow-right"></i>';
  }));

  /* ---------- 6) highlight the nav link of the section on screen ---------- */
  const links = $$('header nav a[href^="#"]');
  const secs  = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && secs.length) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.toggle('hp-active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => so.observe(s));
  }

  /* ---------- 8) team profiles: click a member card to read about them ----------
     Fill each person's text in "about" (one string per paragraph). Empty = "details will be added soon". */
  /* small built-in copies of the team photos: used automatically if the files in the images folder cannot be found */
  const PHOTO_DATA = {
    jl: 'data:image/jpeg;base64,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',
    ds: 'data:image/jpeg;base64,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',
    vp: 'data:image/jpeg;base64,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',
    dp: 'data:image/jpeg;base64,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',
    rt: 'data:image/jpeg;base64,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'
  };

  /* Links: to add a LinkedIn / portfolio link for someone, add this line inside their entry below:
       links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/their-name', icon: 'fa-brands fa-linkedin' }],  */
  /* photo: path of the member's picture, e.g. 'images/name.jpg'. Leave '' to show initials. */
  const MEMBERS = {
    'dhanashree-pundkar': { name: 'Dhanashree Pundkar', role: 'Dietitian', initials: 'DP', photo: 'images/dhanashree-pundkar.jpg', photoAlt: ['dhanashree-pundkar.jpg', 'dhanashree-pundkar.jpeg', 'images/dhanashree-pundkar.jpeg'], photoData: PHOTO_DATA.dp, title: 'About', about: [
      // add paragraphs here (optional)
    ],
      detailsTitle: 'Dietitian Details',
      details: [
        ['Clinic',        'Aadya Diet Consultancy'],
        ['Name',          'Mrs. Dhanashri S. Pundkar'],
        ['Qualification', 'M.Sc. (Food & Nutrition), NDEP'],
        ['Role',          'Clinical Dietitian & Nutritionist'],
        ['Currently',     'Dietitian, Sant Tukaram Cancer Hospital, Akola'],
        ['Previously',    'Former Dietitian, HCG Manavata Cancer Hospital, Nashik']
      ],
      card: 'images/dhanashree-pundkar-card.jpg', cardAlt: ['dhanashree-pundkar-card.jpg', 'card.jpeg', 'images/card.jpeg'],
      contact: { whatsapp: '919096066204', phone: '+919096066204', phoneLabel: '9096 066 204', email: 'dhanashripsarap@gmail.com' }
    },
    'janhavi-lunge': { name: 'Janhavi Janardhan Lunge', role: 'Team member', initials: 'JL', links: [
      { label: 'My Portfolio', href: 'https://janhavi25.netlify.app/', icon: 'fa-solid fa-globe' },
      { label: 'LinkedIn',     href: 'https://www.linkedin.com/in/janhavi-lunge-386828389', icon: 'fa-brands fa-linkedin' }
    ], photo: 'images/janhavi-lunge.jpg', photoAlt: ['janhavi-lunge.jpg', 'Janhavi_Lunge.jpeg', 'images/Janhavi_Lunge.jpeg'], photoData: PHOTO_DATA.jl, title: 'About Me', about: [
      'Hello! My name is Janhavi Janardhan Lunge, and I am currently pursuing my final year of BCA at Maherbanu College of Science and Commerce.',
      'The inspiration for this project comes from my personal experience with dietary restrictions during my fourth semester. Initially, I found it difficult to understand which foods to eat and avoid. With guidance from a dietitian, I learned how to manage my diet properly.',
      'This experience inspired me to develop this project with my team to help others maintain a healthy lifestyle through simple and personalized guidance.'
    ],
      detailsTitle: 'Quick Facts',
      details: [
        ['Name',    'Janhavi Janardhan Lunge'],
        ['College', 'Smt. Maherbanu College of Science and Commerce'],
        ['Course',  'BCA (Final Year)'],
        ['Project', 'CareMate']
      ] },
    'ruchika-thakare':  { name: 'Ruchika Thakare',  role: 'Team member', initials: 'RT', links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/ruchika-thakare-a42936389', icon: 'fa-brands fa-linkedin' }], photo: 'images/ruchika-thakare.jpg', photoAlt: ['ruchika-thakare.jpg', 'ruchika-thakare.jpeg', 'images/ruchika-thakare.jpeg'], photoData: PHOTO_DATA.rt, title: 'About Me', about: [
      'Hello! My name is Ruchika Thakare, and I am currently pursuing my final year of BCA at Smt. Maherbanu College of Science and Commerce.',
      'I am a part of the team that built CareMate, a personalized diet, exercise and wellness recommendation system that helps people follow simple and healthy daily routines.'
    ],
      detailsTitle: 'Quick Facts',
      details: [
        ['Name',    'Ruchika Thakare'],
        ['College', 'Smt. Maherbanu College of Science and Commerce'],
        ['Course',  'BCA (Final Year)'],
        ['Project', 'CareMate']
      ] },
    'dhanashree-sarap': { name: 'Dhanashree Sarap', role: 'Team member', initials: 'DS', links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/dhanshri-sarap-47037538a', icon: 'fa-brands fa-linkedin' }], photo: 'images/dhanashree-sarap.jpg', photoAlt: ['dhanashree-sarap.jpg', 'Dhanashree_sarap.jpeg', 'images/Dhanashree_sarap.jpeg'], photoData: PHOTO_DATA.ds, title: 'About Me', about: [
      'Hello! My name is Dhanashree Sarap, and I am currently pursuing my final year of BCA at Smt. Maherbanu College of Science and Commerce.',
      'I am a part of the team that built CareMate, a personalized diet, exercise and wellness recommendation system that helps people follow simple and healthy daily routines.'
    ],
      detailsTitle: 'Quick Facts',
      details: [
        ['Name',    'Dhanashree Sarap'],
        ['College', 'Smt. Maherbanu College of Science and Commerce'],
        ['Course',  'BCA (Final Year)'],
        ['Project', 'CareMate']
      ] },
    'vedika-pande':     { name: 'Vedika Virendra Pandey',    role: 'Team member', initials: 'VP', links: [
      { label: 'My Portfolio', href: 'https://vedika-pandey-portfolio.netlify.app', icon: 'fa-solid fa-globe' },
      { label: 'LinkedIn',     href: 'https://www.linkedin.com/in/vedikapandey23', icon: 'fa-brands fa-linkedin' }
    ], photo: 'images/vedika-pande.jpg', photoAlt: ['vedika-pande.jpg', 'Vedika_pandey.jpeg', 'images/Vedika_pandey.jpeg'], photoData: PHOTO_DATA.vp, title: 'About Me', about: [
      'Hello! My name is Vedika Virendra Pandey, and I am currently pursuing my final year of BCA at Maherbanu College of Science and Commerce.',
      'As a part of this project, I got the opportunity to work on an idea that connects technology with health and wellness. The main aim of our project is to make diet-related information and healthy lifestyle guidance easier for people to understand and follow.',
      'Being a part of this journey has been a great learning experience, allowing me to explore new ideas, gain practical knowledge, and work together as a team.'
    ],
      detailsTitle: 'Quick Facts',
      details: [
        ['Name',    'Vedika Virendra Pandey'],
        ['College', 'Smt. Maherbanu College of Science and Commerce'],
        ['Course',  'BCA (Final Year)'],
        ['Project', 'CareMate']
      ] }
  };

  /* shows the photo when there is one (falls back to initials if the file is missing) */
  /* tries each picture path in turn and uses the first one that loads */
  const loadFirst = (list, ok, fail) => {
    let i = 0;
    const next = () => {
      if (i >= list.length) { if (fail) fail(); return; }
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = () => { i++; next(); };
      im.src = list[i];
    };
    next();
  };

  /* shows the photo when there is one (falls back to initials if nothing can be loaded) */
  const setAvatar = (el, m) => {
    el.classList.remove('has-photo'); el.textContent = m.initials;
    const list = [].concat(m.photo || [], m.photoAlt || [], m.photoData || []);
    if (!list.length) return;
    loadFirst(list, im => { im.alt = m.name; el.textContent = ''; el.appendChild(im); el.classList.add('has-photo'); });
  };
  /* team cards keep the initials (JL, DS ...). The photo is shown when a profile is opened. */

  const mm = $('#hpMember');
  if (mm) {
    let lastFocus = null;
    const openMember = key => {
      const m = MEMBERS[key]; if (!m) return;
      lastFocus = document.activeElement;
      setAvatar($('#hpMemAv'), m);
      $('#hpMemName').textContent = m.name;
      $('#hpMemRole').textContent = m.role;
      const body = $('#hpMemBody'); body.textContent = '';
      const add = (tag, text) => { const e = document.createElement(tag); e.textContent = text; body.appendChild(e); return e; };
      let any = false;
      if (m.about && m.about.length) { any = true; add('h4', m.title || 'About'); m.about.forEach(t => add('p', t)); }
      if (m.details && m.details.length) {                      // e.g. the dietitian's details
        any = true; add('h4', m.detailsTitle || 'Details');
        const dl = document.createElement('dl'); dl.className = 'hp-dl';
        m.details.forEach(r => {
          const dt = document.createElement('dt'); dt.textContent = r[0];
          const dd = document.createElement('dd'); dd.textContent = r[1];
          dl.append(dt, dd);
        });
        body.appendChild(dl);
      }
      if (m.card) {                                             // visiting card picture
        any = true;
        const fig = document.createElement('figure'); fig.className = 'hp-modal-img';
        body.appendChild(fig);
        loadFirst([].concat(m.card, m.cardAlt || []), im => { im.alt = m.name + ' visiting card'; fig.appendChild(im); }, () => fig.remove());
      }
      if (m.contact) {
        any = true; add('h4', 'Contact');
        const row = document.createElement('div'); row.className = 'hp-contact-row';
        const link = (href, icon, label, external) => {
          const a = document.createElement('a'); a.href = href; a.className = 'hp-cbtn';
          if (external) { a.target = '_blank'; a.rel = 'noopener'; }
          const i = document.createElement('i'); i.className = icon; a.append(i, ' ' + label); row.appendChild(a);
        };
        if (m.contact.whatsapp) link('https://wa.me/' + m.contact.whatsapp, 'fa-brands fa-whatsapp', 'WhatsApp', true);
        if (m.contact.phone)    link('tel:' + m.contact.phone, 'fa-solid fa-phone', m.contact.phoneLabel || m.contact.phone);
        if (m.contact.email)    link('mailto:' + m.contact.email, 'fa-solid fa-envelope', m.contact.email);
        body.appendChild(row);
      }
      if (m.links && m.links.length) {                          // e.g. portfolio website
        any = true; add('h4', 'Links');
        const row = document.createElement('div'); row.className = 'hp-contact-row';
        m.links.forEach(l => {
          const a = document.createElement('a'); a.href = l.href; a.className = 'hp-cbtn'; a.target = '_blank'; a.rel = 'noopener noreferrer';
          const i = document.createElement('i'); i.className = l.icon || 'fa-solid fa-link';
          const ext = document.createElement('i'); ext.className = 'fa-solid fa-arrow-up-right-from-square'; ext.style.fontSize = '.75em';
          a.append(i, ' ' + l.label + ' ', ext); row.appendChild(a);
        });
        body.appendChild(row);
      }
      if (!any) {
        const d = document.createElement('div'); d.className = 'hp-modal-empty';
        d.textContent = 'Profile details will be added soon.'; body.appendChild(d);
      }
      mm.hidden = false; document.body.classList.add('hp-noscroll');
      $('#hpMemClose').focus();
    };
    const closeMember = () => {
      mm.hidden = true; document.body.classList.remove('hp-noscroll');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    $$('.hp-member[data-member]').forEach(card => {
      card.addEventListener('click', () => openMember(card.dataset.member));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMember(card.dataset.member); } });
    });
    $('#hpMemClose').addEventListener('click', closeMember);
    mm.addEventListener('click', e => { if (e.target === mm) closeMember(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mm.hidden) closeMember(); });
  }

  /* ---------- 7) contact form: validate, then send the message with EmailJS ---------- */
  /* EmailJS (https://www.emailjs.com). The public key is meant to be public, so it is safe in the page. */
  const EMAILJS = {
    serviceId:  'service_4h46t3y',
    templateId: 'template_7n6qpik',
    publicKey:  'MG6nTVi7clYTBAYfh',
    toEmail:    'caremate92@gmail.com'
  };

  const form = $('#hpContactForm');
  if (form) {
    const msg = $('#hpFormMsg');
    const rules = {
      hpName:    v => v.trim().length >= 2,
      hpEmail:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      hpMessage: v => v.trim().length >= 10
    };
    const show = (text, bad) => { msg.textContent = text; msg.classList.toggle('bad', !!bad); msg.classList.add('show'); };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if ($('#hpWebsite') && $('#hpWebsite').value) return;               // hidden spam trap: real people leave it empty
      let ok = true;
      Object.keys(rules).forEach(id => {
        const input = $('#' + id), valid = rules[id](input.value);
        input.closest('.hp-field').classList.toggle('err', !valid);
        if (!valid) ok = false;
      });
      if (!ok) return;

      const name = $('#hpName').value.trim(), email = $('#hpEmail').value.trim();
      const topic = $('#hpTopic').value, message = $('#hpMessage').value.trim();
      const btn = form.querySelector('button[type="submit"]'), label = btn.innerHTML;
      const done = () => { btn.disabled = false; btn.innerHTML = label; setTimeout(() => msg.classList.remove('show'), 9000); };

      if (!window.emailjs) {
        show('The email service could not be loaded. Please check your internet and try again, or email us at ' + EMAILJS.toEmail + '.', true);
        return;
      }
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending';

      // These names are sent to your EmailJS template. Use any of them there, e.g. {{from_name}}, {{from_email}}, {{topic}}, {{message}}.
      const params = {
        from_name: name,  name: name,  user_name: name,
        from_email: email, email: email, user_email: email, reply_to: email,
        topic: topic, title: topic, subject: 'CareMate contact: ' + topic,
        message: message,
        to_email: EMAILJS.toEmail, to_name: 'CareMate Team'
      };
      emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, params, { publicKey: EMAILJS.publicKey })
        .then(() => { show('Thank you! Your message has been sent. We will get back to you soon.'); form.reset(); })
        .catch(err => {
          console.error('EmailJS error:', err);
          show('Sorry, your message could not be sent. Please try again, or email us at ' + EMAILJS.toEmail + '.', true);
        })
        .finally(done);
    });
    $$('input,textarea', form).forEach(el => el.addEventListener('input', () => el.closest('.hp-field').classList.remove('err')));
  }
})();


/* ===== Profile page: restore saved answers, prefill name, pre-select the home-page focus, log out ===== */
(function () {
  const form = document.querySelector('#profileForm');
  if (!form) return;
  let saved = null, user = null;
  try {
    saved = JSON.parse(localStorage.getItem('careMateProfile') || 'null');
    user  = JSON.parse(localStorage.getItem('careMateUser') || 'null');
  } catch (e) {}
  const setVal = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined && v !== null && v !== '') el.value = v; };

  if (saved) {                                         // returning visitor: bring back their answers
    ['fullName', 'age', 'weight', 'gender', 'activity', 'condition', 'foodPref', 'notes'].forEach(k => setVal(k, saved[k]));
    if (saved.condition === 'bp' || saved.condition === 'htndm') setVal('condition', 'hypertension');   // merged options
    (saved.goals || []).forEach(g => {
      const cb = form.querySelector('#goalsGrid input[value="' + g + '"]'); if (cb) cb.checked = true;
    });
    if (saved.bp && hasBpCheckbox)       { hasBpCheckbox.checked = true; updateBpSection();
      setVal('bpSystolic', saved.bp.systolic); setVal('bpDiastolic', saved.bp.diastolic); }
    if (saved.sugar && hasSugarCheckbox) { hasSugarCheckbox.checked = true; updateSugarSection();
      setVal('sugarLevel', saved.sugar.level); setVal('sugarType', saved.sugar.type); }
  } else if (user && user.name) {
    setVal('fullName', user.name);                     // first visit: use the name from registration
  }

  const sel = document.querySelector('#condition');    // focus chosen on the home page "Start your plan" card
  try {
    let k = localStorage.getItem('careMateInterest');
    if (k === 'bp' || k === 'htndm') k = 'hypertension';      // merged options
    if (sel && !sel.value && k && Array.from(sel.options).some(o => o.value === k)) sel.value = k;
  } catch (e) {}

  const out = document.querySelector('#pfLogout');     // log out: forget the sign-in, keep nothing visible
  if (out) out.addEventListener('click', () => { try { localStorage.removeItem('careMateUser'); } catch (e) {} });
})();
