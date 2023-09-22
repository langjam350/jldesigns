import * as React from "react"
import 'react-bootstrap'
import 'bootstrap'
import { StaticImage } from 'gatsby-plugin-image'

import { Link } from "gatsby"

const Header = (active) => {
    return (
        <div class="header">
            <nav class="navbar navbar-expand-lg navbar-light primary">
                <a class="navbar-brand" href="/">
                    <StaticImage 
                      src="../images/jlang-designs-logo.png" 
                      alt="HTML allows for custom site design across client services"
                      class="header-logo right-aligned"
                    />
                </a>
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul class="navbar-nav mr-auto">
                        <li class="nav-item">
                            <Link class="nav-link" to="/about/">About</Link>
                        </li>
                        <li class="nav-item">
                            <Link class="nav-link" to="/pricing/">Pricing</Link>
                        </li>
                        <li class="nav-item">
                            <Link class="nav-link" to="/projects/">Projects</Link>
                        </li>
                        <li class="nav-item">
                            <Link class="nav-link" to="/contact/">Contact</Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    )
}

export default Header