import * as React from "react"
import Header from "../components/header"
import 'react-bootstrap'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "@popperjs/core/dist/umd/popper.min.js";

import { Carousel } from 'react-bootstrap'
import { StaticImage } from 'gatsby-plugin-image'
import { Link } from "gatsby"

import mainStyles from "../stylesheets/main.css"


// markup
const IndexPage = () => {
  return (
    <main>
      <title>JLang Designs</title>
      <Header></Header>
      <div class="container ">
        <div class="row">
          <div class="col carousel-col">
            <Carousel>
              <Carousel.Item>
                <Link to="/projects/">
                  <StaticImage 
                    src="../images/dairylandenergy.PNG" 
                    alt="Efficient website designed with client in mind" 
                  />
                </Link>
                <span class="carousel-caption-box">
                  <Carousel.Caption class="carousel-caption primary">
                    <h1>An elegant, organic site built to last. Click to see the results!</h1>
                  </Carousel.Caption>
                </span>
              </Carousel.Item>
            
              <Carousel.Item>
                <Link to="/pricing/">
                  <StaticImage 
                    src="../images/masonrypluswi.PNG" 
                    alt="Custom website designed with css and HTML" 
                  />
                </Link>
                <span class="carousel-caption-box">
                  <Carousel.Caption class="carousel-caption primary">
                    <h1>A custom-built site made to last.<br/> Click to learn about custom site pricing.</h1>
                  </Carousel.Caption>
                </span>
              </Carousel.Item>
            </Carousel>
          </div>
        </div>
        <div class="row">
          <h2 class="primary">Keeping it Simple</h2>
          <div class="col-9">
            <p class="info">
              We prioritize simple and straightforward design in order to provide maximum value to our clients. 
              By putting an emphasis on functionality, and designing simple solutions that meet your needs, 
              we create a great user experience and clear navigation within your site. View the <Link to="/contact/">Contact</Link> page to learn how I can start designing for your business.
            </p>
          </div>
          
          <div class="col-3">
            <StaticImage 
                      src="../images/html.png" 
                      alt="HTML allows for custom site design across client services"
                      class="logo right-aligned"
                    />
          </div>
        </div>
        <div class="row">
          <h2 class="primary right-aligned">Robust Solutions</h2>
          <div class="col-3">
            <StaticImage 
              src="../images/squarespace.png" 
              alt="Squarespace websites designed to fit your needs"
              class="logo"
            />
          </div>
          <div class="col-9">
            <p class="info">
              Working with clients, we build sustainable solutions to provide long term value. A website created by JL designs is created to last, utilizing easy-to-learn
              frameworks and tools such as Squarespace. Learn <Link to="/about/">about</Link> how we can provide sustainable value to you through a website solution.
            </p>
          </div>
        </div>
        <div class="row">
          <h2 class="primary">More Than Just Websites</h2>
          <div class="col-9">
            <p class="info">
              Are you looking to increase your Twitter following? Or make a Facebook page that can boost your business to the next level? Look no further than JLang Designs.
            We design more than just websites, we can also provide social media solutions to help you increase traffic to your website and increase sales to your clients. 
            <br/><Link to="contact">Contact</Link> us for more information on our social media solutions.
            </p>
          </div>
          <div class="col-3">
            <StaticImage 
              src="../images/facebook.png" 
              alt="Squarespace websites designed to fit your needs"
              class="logo right-aligned"
            />
          </div>
        </div>
      </div>
    </main>
  )
}

export default IndexPage
