# ===========================================================
# 🔥 PhoenixUI (Demo UI) - Reyan Patel
# ===========================================================

from email.mime import message
import os
import random
import csv
import pandas as pd
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
from PIL import Image, ImageTk
from Relief.ReliefFinder import ReliefPage
from datetime import datetime
from MentalHealthChatbot.chatbot import chatbot
from MentalHealthChatbot.getResponse import * 
from SatelliteAI.PreTrained.ResNet_Satellite import predict_fire_risk 

# ===========================================================
# MAIN APP
# ===========================================================
class PhoenixAidApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("🔥 Phoenix - From Crisis to Calm")
        self.geometry("1150x700")
        self.configure(bg="#121212")

        # ---- Global Styles ----
        self.style = ttk.Style(self)
        self.style.theme_use("clam")
        self.style.configure(
            "TButton",
            font=("Segoe UI", 11),
            background="#e74c3c",
            foreground="white",
            padding=8
        )
        self.style.map("TButton", background=[("active", "#ff4d4d"), ("pressed", "#c0392b")])
        self.style.configure("Treeview", background="#1e1e1e", foreground="white", fieldbackground="#1e1e1e")
        self.style.configure("TLabel", background="#121212", foreground="white")

        # ---- Header ----
        header = tk.Label(
            self,
            text="🔥 Phoenix: Disaster Assistance System",
            font=("Segoe UI", 18, "bold"),
            bg="#e74c3c",
            fg="white",
            pady=12
        )
        header.pack(fill="x")

        # ---- Layout Split ----
        container = tk.Frame(self, bg="#121212")
        container.pack(expand=True, fill="both")

        self.sidebar = tk.Frame(container, width=230, bg="#181818")
        self.sidebar.pack(side="left", fill="y")

        self.content = tk.Frame(container, bg="#1e1e1e")
        self.content.pack(side="right", expand=True, fill="both")

        # ---- Sidebar ----
        self._create_sidebar()

        # ---- Pages ----
        self.frames = {}
        for F in (AlertPage, SendAlertPage, ReliefPage, ChatPage, DamageAssessmentPage):
            frame = F(self.content, self)
            self.frames[F] = frame
            frame.grid(row=0, column=0, sticky="nsew")

        self.show_frame(AlertPage)

    # -------------------------------------------------------
    def _create_sidebar(self):
        tk.Label(
            self.sidebar,
            text="MENU",
            bg="#181818",
            fg="#e74c3c",
            font=("Segoe UI", 16, "bold"),
            pady=15
        ).pack()

        buttons = [
            ("⚠️  Alert System", AlertPage),
            ("📨  Send Alerts", SendAlertPage),
            ("🏕️  Relief Resource Finder", ReliefPage),
            ("💬  Recovery Chatbot", ChatPage),
            ("🔥  Damage Assessment", DamageAssessmentPage)
        ]

        for text, frame_class in buttons:
            btn = ttk.Button(
                self.sidebar,
                text=text,
                command=lambda f=frame_class: self.show_frame(f)
            )
            btn.pack(fill="x", padx=25, pady=10)

        ttk.Separator(self.sidebar).pack(fill="x", pady=15)
        ttk.Button(self.sidebar, text="Exit", command=self.destroy).pack(side="bottom", fill="x", padx=25, pady=25)

    def show_frame(self, page_class):
        frame = self.frames[page_class]
        frame.tkraise()


# ===========================================================
# PAGE 1: ALERT SYSTEM
# ===========================================================
class AlertPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg="#1e1e1e")

        self.controller = controller
        self.alerts_df = pd.DataFrame()

        tk.Label(
            self, text="🌋 Natural Disaster Alert System",
            font=("Segoe UI", 16, "bold"),
            bg="#1e1e1e", fg="#e74c3c"
        ).pack(pady=25)

        tk.Label(
            self, text="Enter Postal Code / City:",
            font=("Segoe UI", 12),
            bg="#1e1e1e", fg="white"
        ).pack()

        self.entry = ttk.Entry(self, width=30)
        self.entry.pack(pady=10)

        ttk.Button(self, text="Check Alerts", command=self.check_alert).pack(pady=10)
        ttk.Button(self, text="Reload Alert Data", command=self.reload_data).pack(pady=5)

        self.output = tk.Label(
            self, text="", bg="#1e1e1e",
            fg="#ff5c5c", font=("Segoe UI", 12), wraplength=800, justify="center"
        )
        self.output.pack(pady=15)

        # Load alerts once initially
        self.reload_data()

    # -------------------------------------------------------
    def reload_data(self):
        """Reload alert data from CSV (auto when tab is opened)."""
        try:
            data_path = os.path.join(os.path.dirname(__file__), "AlertData", "AlertData.csv")
            if not os.path.exists(data_path):
                data_path = os.path.join(os.path.dirname(__file__), "AlertData", "AlertData.csv")

            if not os.path.exists(data_path):
                self.alerts_df = pd.DataFrame(columns=["Date", "Location", "Radius (km)", "Message"])
                self.output.config(text="No alert data found yet. Send alerts to populate data.")
                return

            self.alerts_df = pd.read_csv(data_path)
            self.output.config(text="✅ Alert data reloaded successfully.")
        except Exception as e:
            self.output.config(text=f"⚠️ Error loading alert data:\n{e}")

    # -------------------------------------------------------
    def check_alert(self):
        """Check if user-entered city/postal has alerts."""
        query = self.entry.get().strip()
        if not query:
            messagebox.showwarning("Input Required", "Please enter a location.")
            return

        # Refresh alerts every time the button is clicked
        self.reload_data()

        if self.alerts_df.empty:
            self.output.config(text="No alerts found.")
            return

        # Case-insensitive search for city/postal substring
        mask = self.alerts_df["Location"].astype(str).str.contains(query, case=False, na=False)
        results = self.alerts_df[mask]

        if results.empty:
            self.output.config(text=f"No active alerts found for {query}. Stay safe! ✅")
        else:
            alerts_text = "\n\n".join(
                f"🚨 {row['Date']} — {row['Location']} ({row['Radius (km)']} km):\n{row['Message']}"
                for _, row in results.iterrows()
            )
            self.output.config(
                text=f"Active alerts for '{query}':\n\n{alerts_text}",
                fg="#ff4d4d"
            )


# ===========================================================
# PAGE 1B: SEND ALERTS (Appends to alerts_log.csv)
# ===========================================================
class SendAlertPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg="#1e1e1e")

        tk.Label(
            self,
            text="📨 Send Emergency Alert",
            font=("Segoe UI", 16, "bold"),
            bg="#1e1e1e",
            fg="#e74c3c"
        ).pack(pady=25)

        form = tk.Frame(self, bg="#1e1e1e")
        form.pack(pady=10)

        tk.Label(form, text="City / Postal Code:", bg="#1e1e1e", fg="white",
                 font=("Segoe UI", 11)).grid(row=0, column=0, sticky="e", padx=5, pady=5)
        self.entry_location = ttk.Entry(form, width=35)
        self.entry_location.grid(row=0, column=1, padx=5, pady=5)

        tk.Label(form, text="Alert Radius (km):", bg="#1e1e1e", fg="white",
                 font=("Segoe UI", 11)).grid(row=1, column=0, sticky="e", padx=5, pady=5)
        self.entry_radius = ttk.Entry(form, width=10)
        self.entry_radius.insert(0, "10")
        self.entry_radius.grid(row=1, column=1, sticky="w", padx=5, pady=5)

        tk.Label(form, text="Alert Message:", bg="#1e1e1e", fg="white",
                 font=("Segoe UI", 11)).grid(row=2, column=0, sticky="ne", padx=5, pady=5)
        self.entry_message = tk.Text(form, width=40, height=5, bg="#222", fg="white", insertbackground="white")
        self.entry_message.grid(row=2, column=1, padx=5, pady=5)

        ttk.Button(self, text="Send Alert", command=self.save_alert).pack(pady=15)

    def save_alert(self):
        """Append a new alert to an existing AlertData.csv, skipping duplicates."""
        location = self.entry_location.get().strip()
        radius = self.entry_radius.get().strip()
        message = self.entry_message.get("1.0", tk.END).strip()

        if not location or not message:
            messagebox.showwarning("Missing Info", "Please fill in all fields before sending an alert.")
            return

        # Path to your existing AlertData.csv
        csv_path = os.path.join(os.path.dirname(__file__), "AlertData", "AlertData.csv")

        # Ensure the file exists — don't create it
        if not os.path.exists(csv_path):
            messagebox.showerror("File Missing", f"⚠️ Could not find AlertData.csv at:\n{csv_path}")
            return

        import pandas as pd
        cols = ["Date", "Location", "Radius (km)", "Message"]

        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            messagebox.showerror("Error Reading CSV", f"Could not read AlertData.csv:\n{e}")
            return

        # Normalize comparison values
        loc_norm = location.casefold().strip()
        msg_norm = " ".join(message.split()).casefold()
        radius_norm = radius.strip() if radius.strip().isdigit() else "N/A"

        if not df.empty:
            loc_series = df.get("Location", pd.Series(dtype=str)).astype(str).str.strip().str.casefold()
            rad_series = df.get("Radius (km)", pd.Series(dtype=str)).astype(str).str.strip()
            msg_series = (
                df.get("Message", pd.Series(dtype=str))
                .astype(str)
                .str.replace(r"\s+", " ", regex=True)
                .str.strip()
                .str.casefold()
            )

            # Detect duplicates
            exact_dup = (loc_series == loc_norm) & (rad_series == radius_norm) & (msg_series == msg_norm)
            area_dup = (loc_series == loc_norm) & (rad_series == radius_norm)

            if exact_dup.any():
                messagebox.showinfo(
                    "Duplicate Skipped",
                    f"Identical alert for '{location}' ({radius_norm} km) already exists."
                )
                return
            if area_dup.any():
                messagebox.showinfo(
                    "Area Already Has Alert",
                    f"An alert for '{location}' within {radius_norm} km already exists."
                )
                return

        # Append the new alert
        from datetime import datetime
        import csv
        new_row = {
            "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "Location": location,
            "Radius (km)": radius_norm,
            "Message": message
        }

        with open(csv_path, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=cols)
            if os.stat(csv_path).st_size == 0:  # Empty file but exists
                writer.writeheader()
            writer.writerow(new_row)

        messagebox.showinfo(
            "Alert Saved",
            f"🚨 Alert recorded for {location} ({radius_norm} km).\n\nMessage:\n{message}"
        )

        # Reset form fields
        self.entry_location.delete(0, tk.END)
        self.entry_radius.delete(0, tk.END)
        self.entry_message.delete("1.0", tk.END)
        self.entry_radius.insert(0, "10")


# ===========================================================
# PAGE 3: RECOVERY CHATBOT
# ===========================================================
# ===========================================================
# PAGE 3: RELIEF CHATBOT (Modern UI)
# ===========================================================
class ChatPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg="#1e1e1e")

        # Header
        tk.Label(
            self,
            text="🤖 Relief ChatBot",
            font=("Segoe UI", 18, "bold"),
            bg="#1e1e1e",
            fg="#e74c3c",
            pady=15
        ).pack()

        tk.Label(
            self,
            text="A calm, supportive assistant for mental health & recovery guidance.",
            font=("Segoe UI", 11),
            bg="#1e1e1e",
            fg="#cccccc"
        ).pack()

        # Chat Display Area
        self.chat_frame = tk.Frame(self, bg="#1e1e1e")
        self.chat_frame.pack(padx=20, pady=20, fill="both", expand=True)

        self.chat_window = scrolledtext.ScrolledText(
            self.chat_frame,
            wrap=tk.WORD,
            width=100,
            height=20,
            state="disabled",
            bg="#181818",
            fg="#f5f5f5",
            font=("Segoe UI", 11),
            padx=12,
            pady=10,
            insertbackground="white",
            relief="flat"
        )
        self.chat_window.pack(fill="both", expand=True)

        # Input Area
        input_frame = tk.Frame(self, bg="#1e1e1e")
        input_frame.pack(fill="x", padx=15, pady=10)

        self.entry = ttk.Entry(input_frame, width=80)
        self.entry.pack(side="left", padx=(5, 10), ipady=6)
        self.entry.bind("<Return>", lambda event: self.send_message())

        send_button = ttk.Button(
            input_frame,
            text="Send 💬",
            command=self.send_message
        )
        send_button.pack(side="left")

        # Initial greeting
        self._insert_chat("ReliefBot", "Hi there 👋\nI’m ReliefBot, here to help you stay calm and find support.\nHow are you feeling today?")

    # -------------------------------------------------------
    def send_message(self):
        user_input = self.entry.get().strip()
        if not user_input:
            return
        self.entry.delete(0, tk.END)
        self._insert_chat("You", user_input)

        try:
            response = chatbot(user_input)
        except Exception as e:
            response = f"⚠️ Sorry, something went wrong:\n{e}"

        # Clean plain-text response (no cryptic junk)
        clean_response = self._clean_text(response)
        self._insert_chat("ReliefBot", clean_response)

    # -------------------------------------------------------
    def _insert_chat(self, sender, message):
        """Neatly insert chat bubbles into the text window."""
        self.chat_window.configure(state="normal")

        # Create sender bubble
        if sender == "You":
            prefix = "🧍You:\n"
            tag = "user"
        else:
            prefix = "🤖 ReliefBot:\n"
            tag = "bot"

        self.chat_window.insert(tk.END, f"{prefix}", tag)
        self.chat_window.insert(tk.END, f"{message}\n\n")

        # Style tags
        self.chat_window.tag_config("user", foreground="#4DA8DA", font=("Segoe UI Semibold", 11))
        self.chat_window.tag_config("bot", foreground="#F39C12", font=("Segoe UI", 11))

        self.chat_window.configure(state="disabled")
        self.chat_window.see(tk.END)

    # -------------------------------------------------------
    def _clean_text(self, text):
        """Remove strange characters and make text readable."""
        cleaned = text.replace("*", "").replace("_", "").replace("#", "").replace("•", "• ")
        cleaned = " ".join(cleaned.split())
        return cleaned.strip()


# ===========================================================
# PAGE 4: DAMAGE ASSESSMENT
# ===========================================================
class DamageAssessmentPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg="#1e1e1e")

        tk.Label(self, text="🔥 Wildfire Damage & Fire Risk Assessment",
                 font=("Segoe UI", 16, "bold"),
                 bg="#1e1e1e", fg="#e74c3c").pack(pady=25)

        ttk.Button(self, text="Upload Image",
                   command=self.upload_image).pack(pady=10)

        self.image_label = tk.Label(self, bg="#1e1e1e")
        self.image_label.pack(pady=10)

        ttk.Button(self, text="Analyze Fire Risk",
                   command=self.analyze_image).pack(pady=10)

        self.result_label = tk.Label(
            self,
            text="",
            font=("Segoe UI", 12, "bold"),
            bg="#1e1e1e",
            fg="white",
            wraplength=700,
            justify="center"
        )
        self.result_label.pack(pady=15)

    def upload_image(self):
        file_path = filedialog.askopenfilename(
            title="Select satellite or drone image",
            filetypes=[("Image Files", "*.jpg *.jpeg *.png *.bmp")]
        )
        if file_path:
            self.image_path = file_path
            self.image = Image.open(file_path)
            self.image.thumbnail((1000, 800))
            img_display = ImageTk.PhotoImage(self.image)
            self.image_label.configure(image=img_display)
            self.image_label.image = img_display
            self.result_label.config(text="✅ Image loaded. Click 'Analyze Fire Risk'.")

    def analyze_image(self):
        if not hasattr(self, "image_path"):
            messagebox.showwarning("No Image", "Please upload an image first.")
            return

        try:
            # Run model prediction
            predicted_class = predict_fire_risk(self.image_path)

            # Get label, color, and description
            FIRE_CLASSES = [
    "Low Fire Risk",
    "Moderate Fire Risk",
    "High Risk, tread with caution",
    "Burned Area",
    "Active Fire - Please Evacuate",
    "Vegetation Loss - Resource Destruction",
    "Safe"
]
            try:
                risk = FIRE_CLASSES[predicted_class] 
            except:
                risk = "Unable to Identify."

            # Display results in UI
            self.result_label.config(text=f"{risk}")
            messagebox.showinfo("Fire Risk Analysis Complete", f"Result: {risk}")

        except Exception as e:
            messagebox.showerror("Error", f"Analysis failed:\n{str(e)}")


# ===========================================================
# RUN APP
# ===========================================================
if __name__ == "__main__":
    app = PhoenixAidApp()
    app.mainloop()
