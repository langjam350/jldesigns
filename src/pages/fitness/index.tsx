import React from "react";
import Navigation from "../../components/Navigation";
import Layout from "../../app/layout";
import Link from "next/link";
import "../../app/globals.css";

const Fitness = () => {
  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Fitness: Enhancing Health and Wellness</h1>
        <p className="text-lg text-gray-700 mb-6">
          Fitness plays a crucial role in maintaining overall health and wellness. Regular physical activity not only strengthens muscles and improves cardiovascular health but also enhances mood, reduces stress, and boosts energy levels.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Engaging in fitness activities such as cardio exercises, strength training, yoga, or sports can improve flexibility, coordination, and balance. It can also aid in weight management, reduce the risk of chronic diseases such as heart disease, diabetes, and certain cancers, and promote longevity.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Furthermore, fitness is not just about physical health; it also has profound effects on mental and emotional well-being. Exercise releases endorphins, the body&apos;s natural mood lifters, which can alleviate symptoms of anxiety, depression, and stress. Regular physical activity promotes better sleep quality, enhances cognitive function, and improves self-esteem and confidence.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Incorporating regular exercise into your routine is essential for maintaining a healthy lifestyle. Aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous-intensity activity per week, along with muscle-strengthening activities on two or more days a week.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          It&apos;s important to find activities you enjoy and make them a regular part of your routine. Whether it&apos;s going for a walk in nature, attending a group fitness class, or playing a sport with friends, finding ways to stay active can make fitness feel more like fun than work.
        </p>
        <p className="text-lg text-gray-700 mb-8">
          For more information on fitness and health, explore our <Link href="/blog" className="text-accent">blog page</Link>. Discover tips, insights, and expert advice to help you achieve your fitness goals and lead a healthier, happier life.
        </p>
      </div>
    </div>
  );
};

export default Fitness;
