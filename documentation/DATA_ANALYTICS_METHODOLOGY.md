# MediInsight AI: Data Analytics & Visual Analytics Methodology

## 1. Analytics Architecture

As an academic BTech Information Technology project, the primary technical emphasis of MediInsight AI is **Data Analytics and Visualization**. The platform systematically demonstrates the complete data analytics lifecycle:
1. **Data Ingestion & Schema Profiling**
2. **Exploratory Data Analysis (EDA) & Summary Statistics**
3. **Bivariate & Multivariate Association Testing**
4. **Time-to-Event Survival Analysis (Kaplan-Meier)**
5. **High-Dimensional Feature Projection (PCA)**
6. **Visual Analytics & Interactive Healthcare Dashboards**

---

## 2. Statistical & Analytical Formulations

### 2.1 Univariate & Bivariate Staging Analysis
* **Summary Metrics:** Five-number summary (Minimum, First Quartile $Q_1$, Median, Third Quartile $Q_3$, Maximum) and sample mean $\mu$ stratified by overall cancer stage (Stage I, II, IIIa, IIIb).
* **Cross-Tabulation:** Contingency table counts $n_{ij}$ mapping Gender ($i \in \{\text{Male}, \text{Female}\}$) against Histological Subtype ($j \in \{\text{Squamous}, \text{Large Cell}, \text{Adenocarcinoma}, \text{NOS}\}$).

### 2.2 Pearson Correlation Analysis
For continuous clinical variables (Age $X$, Overall Survival Time $Y$, Vital Status $Z$):
$$r_{XY} = \frac{\sum_{i=1}^n (X_i - \bar{X})(Y_i - \bar{Y})}{\sqrt{\sum_{i=1}^n (X_i - \bar{X})^2 \sum_{i=1}^n (Y_i - \bar{Y})^2}}$$
The correlation matrix is rendered as an interactive, intensity-mapped table with distinct positive (blue) and negative (rose) opacity scales.

### 2.3 Kaplan-Meier Non-Parametric Survival Estimation
Estimated survival probability $\hat{S}(t)$ at time $t$:
$$\hat{S}(t) = \prod_{t_i \le t} \left( 1 - \frac{d_i}{n_i} \right)$$
where $d_i$ represents the number of observed deaths at time $t_i$, and $n_i$ represents the number of individuals at risk immediately prior to $t_i$.
* Fit using the Python `lifelines` library.
* Stratified across cancer stages (Stage I through IIIb) to illustrate disease-specific survival dynamics.

### 2.4 Principal Component Analysis (PCA) Dimensionality Reduction
To visualize the 20-dimensional 3D CT feature space:
1. Feature matrix $X \in \mathbb{R}^{310 \times 20}$ standardized to zero mean and unit variance.
2. Eigenvalue decomposition of sample covariance matrix $C = \frac{1}{n-1} X^T X$.
3. Projection onto top orthogonal eigenvectors: $Z = X W$.
* **First 3 Principal Components:** Explain **72.6%** of total feature variance ($PC_1 = 43.1\%, PC_2 = 18.2\%, PC_3 = 11.3\%$).

---

## 3. Visual Design & Ergonomics

All visualizations adhere to evidence-based healthcare visualization guidelines:
* **Palette:** Medical tech aesthetic utilizing cyan (`#0891b2`), deep navy (`#0f4c81`), emerald (`#10b981`), and muted slate surfaces (`#f8fafc`).
* **Interactive Tooltips:** Recharts and Plotly provide instantaneous hover tooltips with sample sizes, exact counts, and percentages.
* **Contextual Legends & Axis Labels:** Every axis clearly indicates measurement units (days, years, percentages, counts) and data source provenance.

