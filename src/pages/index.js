import * as React from "react"
import Header from "../components/header"
import 'react-bootstrap'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "@popperjs/core/dist/umd/popper.min.js";

import { Carousel } from 'react-bootstrap'
import { StaticImage } from 'gatsby-plugin-image'

import mainStyles from "../stylesheets/main.css"


// markup
const IndexPage = () => {
  return (
    <main>
      <title>JLang Designs</title>
      <Header></Header>
      <div class="container">
        <div class="row">
          <div class="col carousel-col">
            <Carousel>
              <Carousel.Item>
                <StaticImage 
                  src="../images/dairylandenergy.PNG" 
                  alt="A dinosaur" 
                />
              </Carousel.Item>
              <Carousel.Item>
                <StaticImage 
                  src="../images/masonrypluswi.PNG" 
                  alt="A dinosaur" 
                />
              </Carousel.Item>
            </Carousel>
          </div>
        </div>
      </div>
    </main>
  )
}

export default IndexPage
