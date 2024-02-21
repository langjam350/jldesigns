import Image from 'next/image'
import styles from './page.module.css'
import './globals.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <h3 className="body-header">Designing for 2024</h3>
      <p className="body-1">Designing websites, fitness / health resources, and other recommendations for the future. 
      <br/><br/>
      New resources: Budget Template, Grade Tracking Template</p>
    </main>
  )
}
