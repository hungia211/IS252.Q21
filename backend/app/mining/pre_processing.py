import base64
import io
 
import numpy as np
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
 
matplotlib.use("Agg")
 

#  CORE LOGIC
 
def extract_xy(df: pd.DataFrame) -> tuple[pd.Series, pd.Series, str, str]:
    if df.shape[1] != 2:
        raise ValueError(
            f"DataFrame phải có đúng 2 cột, hiện có {df.shape[1]} cột."
        )
 
    col_x, col_y = df.columns[0], df.columns[1]
    subset = df[[col_x, col_y]].apply(pd.to_numeric, errors="coerce").dropna()
 
    if len(subset) < 3:
        raise ValueError("Cần ít nhất 3 quan sát hợp lệ để tính tương quan Pearson.")
 
    return subset[col_x], subset[col_y], col_x, col_y
 
 
def compute_basic_stats(x: pd.Series, y: pd.Series) -> dict:
    return {
        "n":       len(x),
        "mean_x":  x.mean(),
        "mean_y":  y.mean(),
        "mean_xy": (x * y).mean(),
        "var_x":   x.var(ddof=1),
        "var_y":   y.var(ddof=1),
        "std_x":   x.std(ddof=1),
        "std_y":   y.std(ddof=1),
    }
 
 
def compute_covariance(x: pd.Series, y: pd.Series, mean_x: float, mean_y: float) -> float:
    return float(((x - mean_x) * (y - mean_y)).sum() / (len(x) - 1))
 
 
def compute_pearson_r(cov_xy: float, std_x: float, std_y: float) -> float:
    if std_x == 0 or std_y == 0:
        raise ValueError("Độ lệch chuẩn của X hoặc Y bằng 0 — không thể tính tương quan.")
    return cov_xy / (std_x * std_y)
 
 
def compute_regression_coefficients(
    mean_x: float, mean_y: float,
    r: float, std_x: float, std_y: float
) -> dict:
    b = r * (std_y / std_x)
    a = mean_y - b * mean_x
    return {"slope": b, "intercept": a}
 
 
def interpret_correlation(r: float) -> str:
    abs_r = abs(r)
    direction = "dương" if r >= 0 else "âm"
 
    if abs_r == 1.0:
        return "Tương quan tuyến tính hoàn hảo"
    elif abs_r >= 0.9:
        return f"Mối tương quan {direction} rất mạnh (r ≈ {r:.4f})"
    elif abs_r >= 0.7:
        return f"Mối tương quan {direction} mạnh (r ≈ {r:.4f})"
    elif abs_r >= 0.5:
        return f"Mối tương quan {direction} trung bình (r ≈ {r:.4f})"
    elif abs_r >= 0.3:
        return f"Mối tương quan {direction} yếu (r ≈ {r:.4f})"
    else:
        return f"Mối tương quan rất yếu hoặc không có tương quan tuyến tính (r ≈ {r:.4f})"
 

#  CHART
 
def generate_scatter_chart(
    x: pd.Series, y: pd.Series,
    a: float, b: float, r: float
) -> str:
    fig, ax = plt.subplots(figsize=(8, 6))
 
    ax.scatter(
        x, y,
        color="#4C72B0", alpha=0.75,
        edgecolors="white", linewidths=0.6,
        s=80, label="Dữ liệu quan sát", zorder=3
    )
 
    x_line = np.linspace(float(x.min()), float(x.max()), 300)
    y_line = a + b * x_line
    ax.plot(
        x_line, y_line,
        color="#C44E52", linewidth=2,
        label=f"Phương trình hồi quy: Y = {a:.4f} + {b:.4f}X"
    )
 
    ax.set_title(
        f"Biểu đồ tương quan Pearson\nr = {r:.4f}",
        fontsize=12, fontweight="bold", pad=14
    )
    ax.set_xlabel(x.name, fontsize=11)
    ax.set_ylabel(y.name, fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(True, linestyle="--", alpha=0.5)
    ax.xaxis.set_major_locator(ticker.AutoLocator())
    ax.yaxis.set_major_locator(ticker.AutoLocator())
 
    plt.tight_layout()
 
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)
 
    return base64.b64encode(buf.read()).decode("utf-8")
 
 

#  MAIN SERVICE FUNCTION
 
def analyze_pearson(df: pd.DataFrame) -> dict:
 
    # Extract & validate 
    x, y, col_x, col_y = extract_xy(df)
 
    # Compute
    stats  = compute_basic_stats(x, y)
    cov    = compute_covariance(x, y, stats["mean_x"], stats["mean_y"])
    r      = compute_pearson_r(cov, stats["std_x"], stats["std_y"])
    reg    = compute_regression_coefficients(
                 stats["mean_x"], stats["mean_y"],
                 r, stats["std_x"], stats["std_y"]
             )
    conclusion = interpret_correlation(r)
    chart_b64  = generate_scatter_chart(x, y, reg["intercept"], reg["slope"], r)
 
    # Build result
    return {
        "col_x": col_x,
        "col_y": col_y,
        "n": stats["n"],
        "mean_x": round(stats["mean_x"],  6),
        "mean_y": round(stats["mean_y"],  6),
        "mean_x_times_mean_y": round(stats["mean_x"] * stats["mean_y"], 6),
        "mean_xy":             round(stats["mean_xy"], 6),
        "std_x": round(stats["std_x"], 6),
        "std_y": round(stats["std_y"], 6),
        "var_x": round(stats["var_x"], 6),
        "var_y": round(stats["var_y"], 6),
        "cov": round(cov, 6),
        "linear_regression_formula": f"Y = {reg['intercept']:.4f} + {reg['slope']:.4f}X",
        "r": round(r, 6),
        "conclusion": conclusion,
        "chart": chart_b64,
    }