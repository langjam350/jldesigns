import './globals.css'

export default function Home() {
  return (
    <main className="bg-primary min-h-screen flex items-center justify-center">
      <div className="max-w-4xl px-8 py-12 rounded-lg shadow-lg bg-white text-secondary">
        <h1 className="text-3xl font-bold mb-6 text-secondary">Designing for 2024</h1>
        <p className="text-lg mb-8">Designing websites, social media content, and video generation solutions for the future.</p>
        <p className="text-lg mb-8">New resources: Budget Template, Grade Tracking Template</p>
        <p className="text-lg">As we design for 2024, our mission is to empower individuals to shape their lives for the better. We believe in providing cutting-edge technological solutions and innovative resources to assist our clients in achieving their goals. Whether it&apos;s through personalized website design, social media management, or video generation solutions, we&apos;re dedicated to helping you unlock your full potential. With a focus on creativity, efficiency, and excellence, we&apos;re here to support you on your journey towards a brighter future.</p>
        <br/>
        <p className="text-lg mb-8">Our website features:</p>
        <ul className="list-disc pl-6 mb-8">
          <li className="text-lg">Customizable Website Design: Create personalized websites tailored to your unique needs and preferences.</li>
          <li className="text-lg">Social Media Management: Streamline your content creation and posting across multiple platforms.</li>
          <li className="text-lg">Video Generation Pipeline: Automated video creation with text-to-speech, images, and synchronized captions.</li>
          <li className="text-lg">Content Management: Organize and manage your posts with integrated metadata and video linking.</li>
        </ul>
        <p className="text-lg">Resume:</p>
        <iframe src="./JL_Resume.pdf" className="max-w-4xl" width="100%" height="500px"></iframe>
      </div>
    </main>
  )
}