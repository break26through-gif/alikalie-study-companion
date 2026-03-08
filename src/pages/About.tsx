import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Globe, BookOpen, Users, Sparkles, GraduationCap, Lightbulb } from "lucide-react";
import developerPhoto from "@/assets/developer-photo.jpg";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-6 pb-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-primary/20 shadow-lg">
          <img
            src={developerPhoto}
            alt="Alikalie Fofanah - Developer of Alikalie Study Companion"
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Alikalie Fofanah</h1>
        <p className="mt-1 text-sm text-primary font-medium">Developer & Digital Educator</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Sierra Leone 🇸🇱</p>
      </motion.div>

      {/* Motivation quote */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"
      >
        <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
        <p className="text-sm italic text-foreground leading-relaxed">
          "Through dedication, creativity, and a strong belief in the power of knowledge, we can build technologies
          that inspire learning, drive innovation, and create lasting impact for future generations."
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">— Alikalie Fofanah</p>
      </motion.div>

      {/* Bio sections */}
      <div className="space-y-5">
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">About Alikalie</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Alikalie Fofanah is a passionate technology enthusiast, digital educator, and innovative thinker from Sierra Leone
            who is deeply committed to using technology to improve learning and create opportunities for young people. With a
            strong interest in software development, digital education, and community development, Alikalie has dedicated his
            time to building platforms and initiatives that empower others to learn modern digital skills and become part of the
            global technology ecosystem.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">Journey into Tech</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Currently pursuing studies in Information and Communication Technology (ICT), Alikalie has consistently demonstrated
            a strong passion for problem-solving through technology. His journey into tech began with a simple curiosity about how
            digital tools work, which quickly grew into a mission to create meaningful solutions that can help students learn more
            effectively and efficiently. Over time, he has developed skills in areas such as web development, mobile application
            development, and digital platform design.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">Digital Learning Hub (DLH)</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Alikalie is the founder of Digital Learning Hub (DLH), a professional digital education initiative designed to teach
            practical digital skills such as programming, digital literacy, and modern technology tools. Through DLH, he aims to
            bridge the digital knowledge gap by making tech education more accessible to students and young professionals who want
            to build careers in technology.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">Community Impact</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            In addition to his work in digital education, Alikalie serves as the Resources Lead at Volunteer4Cause Sierra Leone,
            where he contributes to community-driven projects that focus on youth empowerment, education, and innovation. His
            leadership and commitment to service demonstrate his belief that technology should not only create opportunities for
            individuals but also contribute positively to society.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">The Study Companion Vision</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            One of Alikalie's most exciting innovations is the Alikalie Study Companion App, a smart learning assistant designed
            to support students in their academic journey. The idea behind Study Companion was inspired by the challenges many
            students face when studying alone, organizing their learning materials, and accessing helpful academic support outside
            the classroom.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The app was created to act as a digital partner for students — providing tools and features that help users manage
            their study time, organize notes, access learning resources, and stay motivated throughout their academic journey.
            The goal is to make studying more structured, engaging, and productive for students at different levels of education.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">Vision for Africa</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Alikalie believes that technology can transform education by making learning more interactive, personalized, and
            accessible. Beyond this project, Alikalie continues to explore new ways to combine education and technology to build
            innovative solutions. His long-term vision is to develop digital platforms that empower learners, support educators,
            and contribute to the growth of the tech ecosystem in Africa.
          </p>
        </motion.section>
      </div>

      {/* Motivational banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-8 rounded-2xl bg-primary p-5 text-center"
      >
        <p className="text-sm font-semibold text-primary-foreground">
          🌟 Let Alikalie's journey inspire yours!
        </p>
        <p className="mt-1 text-xs text-primary-foreground/80">
          If he can build it, you can learn it. Start your study journey today.
        </p>
      </motion.div>
    </div>
  );
}
