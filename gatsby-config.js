module.exports = {
  siteMetadata: {
    title: `JLang Designs`,
    siteUrl: `https://www.yourdomain.tld`
  },
  plugins: [{
    resolve: 'gatsby-plugin-google-analytics',
    options: {
      "trackingId": "G-J97S5LNPEZ"
    }
  }, 
  "gatsby-plugin-react-helmet", 
  "gatsby-plugin-sitemap",
  `gatsby-plugin-image`,
  `gatsby-plugin-sharp`,
  `gatsby-transformer-sharp`
  ]
};