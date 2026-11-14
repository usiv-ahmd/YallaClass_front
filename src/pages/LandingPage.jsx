// src/pages/LandingPage.jsx
import { useNavigate } from "react-router-dom";
import { 
  Presentation, User, Sparkles, KeyRound, ArrowLeft, 
  BrainCircuit, Swords, Trophy, Rocket, Gift, VenetianMask,
  PlayCircle, BarChart3, ShieldCheck
} from "lucide-react";
import ShoushaCharacter from "../components/student/ShoushaCharacter.jsx";
import "../styles/landing.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      {/* --- Navbar --- */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <Sparkles className="logo-icon" size={24} />
          <span>يلا كلاس</span>
        </div>
        <div className="landing-nav-actions">
          <button className="button button-primary ghost" onClick={() => navigate("/join")}>
            <KeyRound size={16} /> انضم بكود
          </button>
          <button className="button button-primary yellow" onClick={() => navigate("/login")}>
            دخول المدرسين
          </button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className="landing-hero">
        <div className="hero-content">
          <div className="landing-badge">
            <Sparkles size={16} /> أول منصة تفاعلية للحصص بالعربي
          </div>
          <h1 className="landing-title">
            حوّل حصصك لـ <span>معركة حماس</span> ومتعة
          </h1>
          <p className="landing-subtitle">
            منصة "يلا كلاس" بتخلي المدرس يجهز أسئلته بالذكاء الاصطناعي، والطالب يدخل ينافس زمايله، يخصص "شوشة" بتاعه، ويستخدم أوامر مجنونة عشان يكسب!
          </p>
          <div className="hero-actions">
            <button className="button button-primary turquoise hero-btn" onClick={() => navigate("/join")}>
              <User size={20} /> أنا طالب.. يلا نلعب
            </button>
            <button className="button button-primary yellow hero-btn" onClick={() => navigate("/login")}>
              <Presentation size={20} /> أنا مدرس.. جهز الحصة
            </button>
          </div>
        </div>
        <div className="hero-mascot">
          <ShoushaCharacter state="yalla" size={280} />
          <div className="floating-badge badge-1">+50 نقطة <Rocket size={14}/></div>
          <div className="floating-badge badge-2">🔥 ستريك 5</div>
        </div>
      </header>

      {/* --- Role Selection --- */}
      <section className="landing-section">
        <div className="section-heading">
          <h2>اختار طريقك وابدأ</h2>
          <p>سواء كنت مدرس عايز يظبط الحصة، أو طالب مستني ينافس.. مكانك هنا.</p>
        </div>

        <div className="landing-cards">
          {/* كارت المدرس */}
          <div className="card landing-card landing-card--teacher" onClick={() => navigate("/login")}>
            <div className="card-top">
              <div className="card-icon yellow large-icon">
                <Presentation size={32} />
              </div>
              <h3>مساحة المدرس</h3>
            </div>
            <p className="card-desc">تحكم كامل في الحصة من الألف للياء، مع أدوات بتوفر وقتك ومجهودك.</p>
            <ul className="card-features">
              <li><BrainCircuit size={18} className="text-primary" /> توليد أسئلة تلقائي من ملفات PDF.</li>
              <li><PlayCircle size={18} className="text-warning" /> بث مباشر للأسئلة والتحكم في الوقت.</li>
              <li><BarChart3 size={18} className="text-info" /> تقارير تفصيلية وقياس حضور الطلاب.</li>
              <li><ShieldCheck size={18} className="text-success" /> إدارة المنظمة والأعضاء والمساعدين.</li>
            </ul>
            <button className="landing-btn teacher-btn">
              دخول لوحة التحكم <ArrowLeft size={18} />
            </button>
          </div>

          {/* كارت الطالب */}
          <div className="card landing-card landing-card--student" onClick={() => navigate("/join")}>
            <div className="card-top">
              <div className="card-icon turquoise large-icon">
                <User size={32} />
              </div>
              <h3>مساحة الطالب</h3>
            </div>
            <p className="card-desc">مفيش ملل.. ادخل بكود الحصة وابدأ المنافسة مع زمايلك في ثواني.</p>
            <ul className="card-features">
              <li><Sparkles size={18} className="text-primary" /> خصص "شوشة" (الأفاتار) بلونك المفضل.</li>
              <li><Trophy size={18} className="text-warning" /> تنافس على المركز الأول في الـ Leaderboard.</li>
              <li><Swords size={18} className="text-danger" /> استخدم أوامر سرقة، هدايا، وصواريخ ضد خصومك.</li>
              <li><Rocket size={18} className="text-info" /> بونص سرعة الإجابة والستريك العالي.</li>
            </ul>
            <button className="landing-btn student-btn">
              انضم بكود الحصة <KeyRound size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section className="landing-section features-section">
        <div className="section-heading">
          <h2>ليه "يلا كلاس"؟</h2>
          <p>عشان التعليم يبقى ممتع ومؤثر، جمعنا لك أحسن الأدوات في مكان واحد.</p>
        </div>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon turquoise"><BrainCircuit size={28} /></div>
            <h4>ذكاء اصطناعي</h4>
            <p>ارفع ملف الشرح، والمنصة هتطلع لك الأسئلة جاهزة في ثواني.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon yellow"><Gift size={28} /></div>
            <h4>أوامر اللعب</h4>
            <p>هدايا، سرقة نقاط، وصواريخ. خلي الطلاب يتفاعلوا ويقلبوا الطربيزة!</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon pink"><Swords size={28} /></div>
            <h4>منافسة حية</h4>
            <p>عرض مباشر للترتيب، ستريك، وبونص سرعة عشان حماس ميتوقفش.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon blue"><BarChart3 size={28} /></div>
            <h4>تقارير Excel</h4>
            <p>تصدير تقارير كاملة لكل طالب وكل سؤال بضغطة زرار.</p>
          </div>
        </div>
      </section>

      {/* --- How it works --- */}
      <section className="landing-section steps-section">
        <div className="section-heading">
          <h2>إزاي تبدأ؟</h2>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4>سجّل أو انضم</h4>
            <p>المدرس يعمل كويز، والطالب يدخل بكود الحصة.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h4>ابدأ اللايف</h4>
            <p>المدرس يفتح الجلسة، والطلاب تستعد للمعركة.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h4>العب واكسب</h4>
            <p>أجوب بسرعة، استخدم أوامرك، واطلع الأول!</p>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Sparkles size={20} /> يلا كلاس
          </div>
          <p>صنع بحب ❤️ عشان التعليم يبقى أمتع.</p>
          <div className="footer-links">
             <span>سياسة الخصوصية</span>
             <span>شروط الاستخدام</span>
             <span>تواصل معنا</span>
          </div>
        </div>
      </footer>
    </div>
  );
}