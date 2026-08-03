"use client";

import { Card } from '../../../components/Card/Card';
import styles from "./reviews.module.css";
import {
    Star,
    MessageSquare,
    CheckCircle,
    Clock
} from "lucide-react";

export default function ReviewsPage() {

    return (
        <div className={styles.container}>

            <div className={styles.header}>
                <h1 className={styles.title}>
                    Reviews Management
                </h1>
            </div>

            <div className={styles.statsGrid}>

                <Card className={styles.statCard}>

                    <div
                        className={styles.statIcon}
                        style={{
                            color: "var(--primary)",
                            background: "rgba(87,197,204,.15)"
                        }}
                    >
                        <MessageSquare size={24} />
                    </div>

                    <div>
                        <p>Total Reviews</p>
                        <h2>152</h2>
                    </div>

                </Card>

                <Card className={styles.statCard}>

                    <div
                        className={styles.statIcon}
                        style={{
                            color: "#F59E0B",
                            background: "rgba(245,158,11,.15)"
                        }}
                    >
                        <Star size={24} />
                    </div>

                    <div>
                        <p>Average Rating</p>
                        <h2>4.7</h2>
                    </div>

                </Card>

                <Card className={styles.statCard}>

                    <div
                        className={styles.statIcon}
                        style={{
                            color: "#10B981",
                            background: "rgba(16,185,129,.15)"
                        }}
                    >
                        <CheckCircle size={24} />
                    </div>

                    <div>
                        <p>Approved</p>
                        <h2>138</h2>
                    </div>

                </Card>

                <Card className={styles.statCard}>

                    <div
                        className={styles.statIcon}
                        style={{
                            color: "#F59E0B",
                            background: "rgba(245,158,11,.15)"
                        }}
                    >
                        <Clock size={24} />
                    </div>

                    <div>
                        <p>Pending</p>
                        <h2>14</h2>
                    </div>

                </Card>

            </div>

        </div>
    );
}