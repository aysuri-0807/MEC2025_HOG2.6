
'''
Description: Implementing the backend for the ReliefBot chatbot 
Author: Andy Suri
'''

from MentalHealthChatbot.getResponse import genResponse  

instructions = "You are a Mental Health Chatbot called ReliefBot designed to provide mental health services and help during a time of crisis (ie wildfires). You will be speaking to people who are experiencing this situation, your job is to calm people down and recommend them to use our ReliefFinder app to find their nearest relief center. YOU ARE TO PROVIDE CONCISE RESPONSES MAX 3-4 SENTENCES. The users prompt is -> "

def chatbot(prompt):
    output = genResponse(prompt,instructions) 
    return output 


if __name__ == "__main__":
    print (chatbot("Hello, please help me!"))

