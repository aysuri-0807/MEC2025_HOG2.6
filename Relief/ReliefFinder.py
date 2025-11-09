
# ===========================================================
# PAGE 2: RELIEF RESOURCE FINDER (Final Version, using ReliefCenters.csv)
# ===========================================================
from ast import alias
import os
from tkinter import messagebox
import pandas as pd
import tkinter as tk
from tkinter import ttk, messagebox


class ReliefPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg="#1e1e1e")

        # ---------- HEADER ----------
        tk.Label(
            self,
            text="🏕️ Relief Resource Finder",
            font=("Segoe UI", 16, "bold"),
            bg="#1e1e1e",
            fg="#e74c3c"
        ).pack(pady=25)

        tk.Label(
            self,
            text="Enter City or Province (e.g., Toronto or BC):",
            font=("Segoe UI", 12),
            bg="#1e1e1e",
            fg="white"
        ).pack()

        self.entry = ttk.Entry(self, width=40)
        self.entry.pack(pady=10)

        ttk.Button(self, text="Find Resources", command=self.find_relief).pack(pady=10)

        # ---------- RESULTS TABLE ----------
        self.tree = ttk.Treeview(
            self,
            columns=("Name", "Type", "City", "Distance", "Contact"),
            show="headings",
            height=12
        )
        for col, w in [
            ("Name", 280),
            ("Type", 120),
            ("City", 160),
            ("Distance", 120),
            ("Contact", 180)
        ]:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=w, anchor="center")

        self.tree.pack(padx=20, pady=15, fill="both", expand=True)

        ttk.Button(self, text="Reload Data", command=self.reload_data).pack(pady=5)

        # Load the dataset once
        self.data = self.load_data()

    # -------------------------------------------------------
    def load_data(self):
        data_path = os.path.join(os.path.dirname(__file__), "", "ReliefCenters.csv")
        if not os.path.exists(data_path):
            messagebox.showerror(
                "File Missing",
                f"ReliefCenters.csv not found at:\n{data_path}\n\nPlease add it to the /data folder."
            )
            return pd.DataFrame(columns=[
            "Province", "Province_Full", "City", "Name", "Type", "Distance (km)", "Contact"
            ])
        try:
            df = pd.read_csv(data_path)
            expected_cols = ["Province", "Province_Full", "City", "Name", "Type", "Distance (km)", "Contact"]
            missing = [c for c in expected_cols if c not in df.columns]
            if missing:
                raise ValueError(f"CSV missing columns: {missing}")
            return df
        except Exception as e:
            messagebox.showerror("Error Loading Data", f"Could not load ReliefCenters.csv:\n{e}")
            return pd.DataFrame(columns=[
                "Province", "Province_Full", "City", "Name", "Type", "Distance (km)", "Contact"
            ])

    # -------------------------------------------------------
    def reload_data(self):
        """Reload the CSV file in case it was updated."""
        self.data = self.load_data()
        messagebox.showinfo("Data Reloaded", "ReliefCenters.csv reloaded successfully!")

    # -------------------------------------------------------
    def filter_centers(self, query):
        """City-first search, then province (code or full), case-insensitive, with graceful fallback."""
        if self.data.empty:
            return pd.DataFrame()

        q = query.strip().upper()
        if not q:
            return pd.DataFrame()

        df = self.data.copy()

    # Uppercase copies for comparison (keep originals for display)
        city_u = df["City"].astype(str).str.strip().str.upper()
        prov_u = df["Province"].astype(str).str.strip().str.upper()
        prov_full_u = df["Province_Full"].astype(str).str.strip().str.upper()

    # Distance column name (keep original so display_results works)
        dist_col = "Distance (km)"
        if dist_col not in df.columns:
        # fallback if someone renamed it slightly
            candidates = [c for c in df.columns if c.lower().startswith("distance")]
            dist_col = candidates[0] if candidates else None

    # Common aliases users type
        alias = {
            "PEI": "PRINCE EDWARD ISLAND",
            "NWT": "NORTHWEST TERRITORIES",
            "NFLD": "NEWFOUNDLAND AND LABRADOR",
            "NL":  "NEWFOUNDLAND AND LABRADOR"
        }
        q_eff = alias.get(q, q)

    # 1) Exact province match (short OR full)
        mask_prov_exact = (prov_u == q_eff) | (prov_full_u == q_eff)
        if mask_prov_exact.any():
            out = df.loc[mask_prov_exact]
            return out.sort_values(by=dist_col).reset_index(drop=True) if dist_col else out.reset_index(drop=True)

    # 2) City substring match
        mask_city = city_u.str.contains(q, na=False)
        if mask_city.any():
            out = df.loc[mask_city]
            return out.sort_values(by=dist_col).reset_index(drop=True) if dist_col else out.reset_index(drop=True)

    # 3) Province FULL partial fallback (e.g., "british" → BRITISH COLUMBIA)
        mask_prov_partial_full = prov_full_u.str.contains(q, na=False)
        if mask_prov_partial_full.any():
            fallback_name = prov_full_u.loc[mask_prov_partial_full].iloc[0].title()
            messagebox.showinfo(
                "Nearby Results",
                f"No centers found in '{query.title()}'. Showing centers in {fallback_name} instead."
            )
            out = df.loc[mask_prov_partial_full]
            return out.sort_values(by=dist_col).reset_index(drop=True) if dist_col else out.reset_index(drop=True)

    # 4) Province CODE partial fallback (e.g., "o" → ON)
        mask_prov_partial_code = prov_u.str.contains(q, na=False)
        if mask_prov_partial_code.any():
            messagebox.showinfo(
                "Nearby Results",
                f"No centers found in '{query.title()}'. Showing province matches instead."
            )
            out = df.loc[mask_prov_partial_code]
            return out.sort_values(by=dist_col).reset_index(drop=True) if dist_col else out.reset_index(drop=True)

    # 5) Nothing matched
        messagebox.showinfo("No Results", f"No relief centers found for '{query}'.")
        return pd.DataFrame()

    # -------------------------------------------------------
    def display_results(self, df):
        """Display filtered results in the Treeview."""
        for row_id in self.tree.get_children():
            self.tree.delete(row_id)

        if df.empty:
            messagebox.showinfo("No Results", "No matching relief centers found.")
            return

        for _, row in df.iterrows():
            self.tree.insert(
                "",
                "end",
                values=(
                    row["Name"],
                    row["Type"],
                    row["City"],
                    f"{row['Distance (km)']} km",
                    row["Contact"],
                ),
            )

    # -------------------------------------------------------
    def find_relief(self):
        """Main button logic for finding relief centers."""
        query = self.entry.get().strip()
        if not query:
            messagebox.showwarning("Input Required", "Please enter a city or province name.")
            return

        results = self.filter_centers(query)
        self.display_results(results)
# ===========================================================
# PAGE 2: RELIEF RESOURCE FINDER (Final Version, using ReliefCenters.csv)
# ===========================================================
from ast import alias
import os
from tkinter import messagebox
import pandas as pd
import tkinter as tk
from tkinter import ttk, messagebox


class ReliefPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg="#1e1e1e")

        # ---------- HEADER ----------
        tk.Label(
            self,
            text="🏕️ Relief Resource Finder",
            font=("Segoe UI", 16, "bold"),
            bg="#1e1e1e",
            fg="#e74c3c"
        ).pack(pady=25)

        tk.Label(
            self,
            text="Enter City or Province (e.g., Toronto or BC):",
            font=("Segoe UI", 12),
            bg="#1e1e1e",
            fg="white"
        ).pack()

        self.entry = ttk.Entry(self, width=40)
        self.entry.pack(pady=10)

        ttk.Button(self, text="Find Resources", command=self.find_relief).pack(pady=10)

        # ---------- RESULTS TABLE ----------
        self.tree = ttk.Treeview(
            self,
            columns=("Name", "Type", "City", "Distance", "Contact"),
            show="headings",
            height=12
        )
        for col, w in [
            ("Name", 280),
            ("Type", 120),
            ("City", 160),
            ("Distance", 120),
            ("Contact", 180)
        ]:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=w, anchor="center")

        self.tree.pack(padx=20, pady=15, fill="both", expand=True)

        ttk.Button(self, text="Reload Data", command=self.reload_data).pack(pady=5)

        # Load the dataset once
        self.data = self.load_data()

    # -------------------------------------------------------
    def load_data(self):
        data_path = os.path.join(os.path.dirname(__file__), "", "ReliefCenters.csv")
        if not os.path.exists(data_path):
            messagebox.showerror(
                "File Missing",
                f"ReliefCenters.csv not found at:\n{data_path}\n\nPlease add it to the /data folder."
            )
            return pd.DataFrame(columns=[
            "Province", "Province_Full", "City", "Name", "Type", "Distance (km)", "Contact"
            ])
        try:
            df = pd.read_csv(data_path)
            expected_cols = ["Province", "Province_Full", "City", "Name", "Type", "Distance (km)", "Contact"]
            missing = [c for c in expected_cols if c not in df.columns]
            if missing:
                raise ValueError(f"CSV missing columns: {missing}")
            return df
        except Exception as e:
            messagebox.showerror("Error Loading Data", f"Could not load ReliefCenters.csv:\n{e}")
            return pd.DataFrame(columns=[
                "Province", "Province_Full", "City", "Name", "Type", "Distance (km)", "Contact"
            ])

    # -------------------------------------------------------
    def reload_data(self):
        """Reload the CSV file in case it was updated."""
        self.data = self.load_data()
        messagebox.showinfo("Data Reloaded", "ReliefCenters.csv reloaded successfully!")

    # -------------------------------------------------------
    def filter_centers(self, query):
        """City-first search, then province (code or full), case-insensitive, with graceful fallback."""
        if self.data.empty:
            return pd.DataFrame()

        q = query.strip().upper()
        if not q:
            return pd.DataFrame()

        df = self.data.copy()

    # Uppercase copies for comparison (keep originals for display)
        city_u = df["City"].astype(str).str.strip().str.upper()
        prov_u = df["Province"].astype(str).str.strip().str.upper()
        prov_full_u = df["Province_Full"].astype(str).str.strip().str.upper()

    # Distance column name (keep original so display_results works)
        dist_col = "Distance (km)"
        if dist_col not in df.columns:
        # fallback if someone renamed it slightly
            candidates = [c for c in df.columns if c.lower().startswith("distance")]
            dist_col = candidates[0] if candidates else None

    # Common aliases users type
        alias = {
            "PEI": "PRINCE EDWARD ISLAND",
            "NWT": "NORTHWEST TERRITORIES",
            "NFLD": "NEWFOUNDLAND AND LABRADOR",
            "NL":  "NEWFOUNDLAND AND LABRADOR"
        }
        q_eff = alias.get(q, q)

    # 1) Exact province match (short OR full)
        mask_prov_exact = (prov_u == q_eff) | (prov_full_u == q_eff)
        if mask_prov_exact.any():
            out = df.loc[mask_prov_exact]
            return out.sort_values(by=dist_col).reset_index(drop=True) if dist_col else out.reset_index(drop=True)

    # 2) City substring match
        mask_city = city_u.str.contains(q, na=False)
        if mask_city.any():
            out = df.loc[mask_city]
            return out.sort_values(by=dist_col).reset_index(drop=True) if dist_col else out.reset_index(drop=True)

    # 3) Province FULL partial fallback (e.g., "british" → BRITISH COLUMBIA)
        mask_prov_partial_full = prov_full_u.str.contains(q, na=False)
        if mask_prov_partial_full.any():
            fallback_name = prov_full_u.loc[mask_prov_partial_full].iloc[0].title()
            messagebox.showinfo(
                "Nearby Results",
                f"No centers found in '{query.title()}'. Showing centers in {fallback_name} instead."
            )
            out = df.loc[mask_prov_partial_full]
            return out.sort_values(by=dist_col).reset_index(drop=True) if dist_col else out.reset_index(drop=True)

    # 4) Province CODE partial fallback (e.g., "o" → ON)
        mask_prov_partial_code = prov_u.str.contains(q, na=False)
        if mask_prov_partial_code.any():
            messagebox.showinfo(
                "Nearby Results",
                f"No centers found in '{query.title()}'. Showing province matches instead."
            )
            out = df.loc[mask_prov_partial_code]
            return out.sort_values(by=dist_col).reset_index(drop=True) if dist_col else out.reset_index(drop=True)

    # 5) Nothing matched
        messagebox.showinfo("No Results", f"No relief centers found for '{query}'.")
        return pd.DataFrame()

    # -------------------------------------------------------
    def display_results(self, df):
        """Display filtered results in the Treeview."""
        for row_id in self.tree.get_children():
            self.tree.delete(row_id)

        if df.empty:
            messagebox.showinfo("No Results", "No matching relief centers found.")
            return

        for _, row in df.iterrows():
            self.tree.insert(
                "",
                "end",
                values=(
                    row["Name"],
                    row["Type"],
                    row["City"],
                    f"{row['Distance (km)']} km",
                    row["Contact"],
                ),
            )

    # -------------------------------------------------------
    def find_relief(self):
        """Main button logic for finding relief centers."""
        query = self.entry.get().strip()
        if not query:
            messagebox.showwarning("Input Required", "Please enter a city or province name.")
            return

        results = self.filter_centers(query)
        self.display_results(results)
