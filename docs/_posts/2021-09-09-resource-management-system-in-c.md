---
layout: post
title: Resource management system in C/C++
categories:
    - C/C++
author:
- Teo Parashkevov
meta: [resource, management, c, c++]
thumbnail_location: resource-management-system-in-c
description: A guide to creating a system resource information messaging system using the Telegram Bot API in C/C++
---

# Introduction

The increasing popularity of alternative messaging apps like Telegram, Signal, Tox and many others, has led to a rapid development in a variety of aspects in these social platforms. More capabilities have been added in order to stay competitive in the market; APIs have been gradually broadening their features.

This development expansion has given both users and developers a vast range of opportunities to implement their own systems on-top of these APIs.

In this article I will be describing the process of creating a simple telegram bot service using a specialized C/C++ library and systemd services on Linux.

# The TgBot-cpp Library

This library gives the programmer a wide variety of classes and functions which communicate with the Telegram API. The library can be found on GitHub, as well as documentation here.

The library consists of 3 modules:

- General — The API class, the Bot class, EventBroadcaster class [event management is done here] and the TelegramBotException class
- Types — Basic types like, TextMessage, AuidoMessage, FileMessage, Chat, …
- Net — takes care of the HTTP communication as well as the SSL encryption

These 3 modules lay the foundation to all Telegram Bots that use this library. The usual process of creating a bot object and binding it to a real Telegram Bot is simple.

- A Telegram Bot object is instantiated with a token parameter
- Various event handlers are bind to the bot object depending on the situation and the event type.
- The bot object enters the main loop where it waits for event and executes callbacks respectively.

# Creating a Telegram Bot

As show in the official website here, creating a Telegram Bot does not require any special programming skills. The process is quite simple, and anyone with an active Telegram account can create a number of bots.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/3.png" | relative_url }}" />

As described in the Bot Father section, the first step in creating a Bot is to open a chat with Bot Father — Telegrams specialized Frond-end for creating other bots. Then send the command /newbot(strings starting with “/” represent commands to be executed by the bots ) to the chat with Bot Father. The third step is to provide the newly created Bot with a display name and a username. After all the above steps have been completed successfully, Bot Father will display general information about the newly created bot.

The most important piece of information regarding your bot is the TOKEN. Only through the token can one access the capabilities of the bot and program specialized software for bot management. The token usually is a string with the following format: 

```bash
<bot_id>:<bot_access_key>
```

The important parameters (as listed in the original documentation) for any Telegram Bot are shown below :

- The name of your bot is displayed in contact details and elsewhere.
- The Username is a short name, to be used in mentions and t.me links. Usernames are 5–32 characters long and are case insensitive, but may only include Latin characters, numbers, and underscores. Your bot’s username must end in ‘bot’, e.g. ‘tetris_bot’ or ‘TetrisBot’.
- The token is a string along the lines of 110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw that is required to authorize the bot and send requests to the Bot API. Keep your token secure and store it safely, it can be used by anyone to control your bot.

# System Architecture

## Main Goal

The main goal of the program that I will be showing here is to send messages to a particular char in Telegram. The contents of these messages shall be acquired from files within a specific directory. This can be very useful, especially in system administration. In my particular case, I have important information like CPU usage, RAM usage, CPU temperature, etc. which in some extreme situations, needs to be managed, in some sense, directly by me. In order to be notified immediately of a particular circumstance, I need something to act immediately and send that information directly to me. I designed this simple program to make use of the Telegram API and send me information directly to my Telegram account.


## Architecture

The architecture of the system is quite simple. I will divide each feature of this system into a specific module. In order to get the needed information from the system, like CPU, RAM etc. I have written other programs/scripts that fetch that particular information, format it and store it in files on the filesystem. This is the information gathering module. The communication module is the program that we will discuss today in this article — the Telegram Bot; It checks the files for new information and sends the new information directly to the chat that I have opened with this Bot. The system manger module here is represented by systemd. I have created a simple service that is responsible for the Telegram Bot and its child processes. Simply said, the design of this system goes something along the lines of:

There are some scripts that are execute and gather information about the system; They write that information into files; The Telegram Bot program will create N processes for each file that needs to be watched. Each process is responsible for one file only; If a file gets modified, a message will be sent to the recipient using the Telegram Bot API with the modified file contents. All of this will be managed by a systemd service.

In order to make things clear, I would like to conceptually divide the content information from the actual perpetrator which will send messages through the Telegram Bot API. The program responsible for the Telegram Bot will not deal with or manage any files on the filesystem, it will only be allowed to read a particular file and nothing more. This will increases the security of the system overall. The main reason being the low coupling of the module responsible for file management and the module responsible for sending the messages. Another reason I believe increases the level of security is the fact that even if, one day, a particular bug is found in the Telegram API that grants access to the remote executing program, the program itself will not have many features/options that give the attacker any type of advantage over the system.


<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/4.jpg" | relative_url }}" />

Figure 1 provides a simple example of how the system architecture will look. In this example there are 5 resources that need to be managed by the system — CPU usage, RAM usage, Network traffic, system temperature and some other resource. There are 5 jobs belonging to the information gathering module which write information to their respective files on the filesystem. The main Telegram Bot process creates 5 child processes to manage each resource file. Each child process is responsible for one file only and it checks its file descriptor every M milliseconds for modifications. If the file has been modified, the contents are sent to the Telegram Bot object shared by all child processes and then sent to a specific chat. If the file has not been modified, the child process does not execute any additional code.

1. Information gathering module

This paragraph is mainly informative and therefore does not dive deep in specifics on how to implement such modules.

This module consists mainly of bash scripts, that are executed at a given interval. the output of these scripts is then piped >> to a file, which later on the Telegram Bot process reads.

You can implement your own information gathering module by again using bash scripts, compiling a program, overwriting files through the network by another machine etc.
2. Communication module

This paragraph describes the design of the communication module, responsible for reading the file contents and sending messages to the appointed chat id.

The main Telegram Bot process will be responsible for the creation of N child processes, which will constantly be checking if their designated file has been modified. On Figure 1 the main Telegram Bot process is represented as a blue square, each child process is a line inside the square which gets information from a specific file on the filesystem. For example, the CPU process reads the cpu.file.txt every M milliseconds and keeps track of the last modified timestamp.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/5.jpg" | relative_url }}" />

In order to optimize this service a bit, we can implement an environment variable specific for each child process. This environment variable will contain the value of the last_modified_timestamp of the respective file [in Unix time]. In this way, each child process is self-sufficient and does not rely on anything else for its execution. The environment variable names are shown on Figure 2 in each child process box in green.

[ Note ] In GNU/Linux when a process creates a child process, the child process is “granted access” to the parent processes’ resources i.e. environment variables. However, the child does not share its environment with its parent.

Once this environment variable has been set, it is then compared to the real-time last_modified_timestamp every M milliseconds.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/6.jpg" | relative_url }}" />

Figure 3 shows the process of sending the file contents from the cpu.file.txt. After the cpu get info job has written the new content to the file, the modified flag has changed. As this happens, the child process responsible for the cpu file has waited M milliseconds and therefore can go and compare the last_modified_timestamp value, stored in CPU_ENV_VAR with the current modified flag of the file. Because the file was modified within the M millisecond “sleep” time period of the child process, the two modified values do not match. Therefore, the contents of the file have to be sent to the Telegram Bot object, which is shared among all child processes. After that the Telegram Bot object can call send_message() function and send the new file content to a specific chat [chat_id].

The process of sending the modified file contents with the help of the Telegram Bot object is the same amongst all child processes.

3. System Manager module

This paragraph describes the design of the system manager module, responsible for the creation and termination of any Telegram Bot service here.

The system manager module will be able to create and manage any given Telegram Bot service. This module consists of a give number of telegram bot services — systemd service files located in the /etc/systemd/system/ directory. Each service will have its main process [ExecStart=] set to the already compiled Telegram Bot executable. The executable will take 2 arguments; the first argument will be the configuration directory that stores the resource files needed to be watched; the second argument will be process verbosity.

Termination of the service and all its subsequent child processes will also be managed through systemd. Because the main parent process will create N number of child processes and then exit [return 0] this leaves these N child processes in the CGroup of the service. In order to stop the service these child processes need to be stopped/terminated.

[ Note ] If you are not familiar with systemd unit file syntax or need a reminder of how some simple services are created, I encourage you to go read my article [Systemd] simple service examples.


# (Code) Communication module

The code repository for this project is located here[GitHub]. You are free to use and modify it [✌️🏼] . If you find any errors or have any suggestions, please let me know be contacting me here or on other platforms.

The communication module is separated into 3 files: main.cpp, config.h and config.cpp. As you are familiar with C/C++ the main.cpp file contains the main function; the config.h is the header file and config.cpp is the implementation of the config header. I have decided to use this simple structure in order to contain most of the program within a small number of files, as well as having a clear logical distinction between them.

The basic program logic contains the following functions:

    A function responsible for the creation of environment variables inside a given process;
    A function responsible for

## The config.h Header

This header file contains include directives for the required libraries, definitions for length and size of different buffers and variables, and also function declarations.

- ENV_CHAR_VARIABLE_LENGTH — defines the length of the environment variable name for each child process [default: 16 bytes]
- SIZE_ENV_CHAR_VARIABLE — defines the size of the environment variable for each child process [default: 16 bytes]
- SIZE_FILE_NAME — defines the size of the file name buffer to be read from the filesystem [default 256 characters i.e. 256 bytes]
- CONTENT_BUFFER_SIZE — the size of the buffer that will store the contents of the file of each child process [default 4 MB]

Inside config.h there is also a structure called directory_files, which includes two variables; _p which is the pointer to an allocated space where the file names of a particular directory are stored; _count which returns the number of files in that particular directory. This structure is used in the return type of the function list_files_in_directory().

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/7.jpg" | relative_url }}" />

Function declarations include the following functions:

- create_environment_variable() — creates environment variable with name _name and value _val inside the invoking process.
- send_message_to_char() — sends a message to _chat_id after comparing env_var_name with its previous value; this is the environment variable name for the variable that stores the last_modified_timestamp. _flag is a flag for verbosity. _file_path is the path to the file from which to read its contents. TgBot::Bot * b is a pointer to the common Telegram Bot object from TgBot-cpp library that is shared amongst all child processes.
- list_files_in_directory() — indexes files inside the _dir_path directory and returns a directory_files structure.
- get_file_last_modified_time() — returns the last_modified_timestamp of a file with path _file_path [default format: Unix time]
- get_file_name() — returns the name of the file without the .xxx extension/format
- get_folder_name() — returns the converted long long integer value of a numerical folder name i.e. when a folders name is the chad_id it gets converted from an array of characters to a long long integer.

## The config.cpp Implementation

The config.cpp file contains implementations of the function definitions from the config.h header file.

- int create_environment_variable(char * _name, char * _val) — This function takes two parameters _name and _val and creates an environment variable in the current process using the setenv() function. We add fflush(stdout) because when a child process is called and executes this function inside systemd service, the journal program that keeps logs of each service in systemd will not get the output of printf() unless flushed. [ Important ] If not flushed, this buffer (stdout) can grow a lot and consume a vast amount of memory resource.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/8.jpg" | relative_url }}" />

- void send_message_to_chat(unsigned long long int _chat_id, char * env_var_name, TgBot::Bot *b, char * _file_path, int _flag) — This function is basically one big infinite while loop. This function is called once a new child process has been successfully created. Therefore keeping each child process inside its own infinite loop.

Firstly, this functions tries to get the environment variable env_var_name and its value. If this process is not successful, the loop is broken and there is nothing else to do. Therefore the programmer must investigate this issue.

Once the environment variable with the last_modified_timestamp has been gotten, then the function executes get_last_modified_time() onto the file with path _file_path. Then this value gets stored inside a string _last_modified_char. Afterwards the environment variable value and the current last modified time stamp are to be compared. If they differ this means that the file has been modified within the sleep period, therefore a message must be send to chat_id. If they are the same nothing is to be done.

Secondly, the file contents must be acquired. We allocate CONTENT_BUFFER_SIZE amount of space for the contents of the file. Afterwards while the content of the file is being looped over a temporary character stores the current character of the file content in the content buffer. Once the End Of the File has been reached, we append 0x00 to indicate the end of the content buffer. After this procedure has been done, we can close the file.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/9.jpg" | relative_url }}" />

Thirdly, after the information from the file has been copied to the content buffer, it must be appended inside a message variable of type string. This message variable is later passed to the sendMessage() function by the Telegram Bot object. Sending a message using the Telegram Bot object must be enclosed inside a try..catch.. block because of error prevention. For example, if for some reason the machine that is running this service is not connected to the internet and does not have the possibility to contact the Telegram API, then sending a message will result in an error. We catch 2 types of errors inside this block: 1) a system error and 2) TgException error.

Finally, we clean up all the allocated space for the buffers and flush all the printf statements to stdout and we sleep for 5 seconds. This is the final statement that gets executed before running the loop again from the beginning.

[ Note ] When _flag is set to 1, the print statements get executed, when _flag is set to 0 the print statements are not executed. This is a simple implementation of verbosity management.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/10.jpg" | relative_url }}" />

- directory_files * list_files_in_directory(char * _dir_path ) — This function takes one parameter, namely _dir_path and allocates a piece of memory to store the names of the files listed in that particular directory. Afterwards, this allocated memory block is being pointed to by pointer _p of the structure directory_files and also the number of files present inside the directory is saved inside the variable _count inside that same structure. Here we have already predefined SIZE_FILE_NAME, therefore we allocate that much memory for the name of the first file listed inside the directory. We want to exclude the “.” and “..” paths, that being the reason why we have a conditional statement inside the while loop. On each iteration of the loop a new file from the directory is listed, then it is compared if it matches the excluded paths. If not, we reallocate i.e. expand the currently allocated memory block with filenames to have place for one more file name. We also increment the number of currently listed files. Finally, the function returns a pointer to a structure holding a pointer pointing to the beginning of the already expanded memory block with file names and a _count variable holding the number of listed files.

[ Note ] The increment for the file names here is SIZE_FILE_NAME, not 1. This is the reason for having the line _current_file = _return_val + ( n * SIZE_FILE_NAME ) . Basically, for each new file name that must be stored in the per-allocated memory space there must be SIZE_FILE_NAME bytes, no matter if the file name is long enough to fill the whole SIZE_FILE_NAME space.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/11.jpg" | relative_url }}" />

- long long int get_file_last_modified_time(char *_file_path) —This function acquires the last modified timestamp for a particular file using the stat structure and stat() function. On success the result is returned in Unix time, otherwise -1 is the return value.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/12.jpg" | relative_url }}" />

- char * get_file_name(char * _file_name_w_extension) — This function has a parameter that is the file name with extension. This parameter is run through a for loop starting from the first character in the file name and looping through the whole name until the pointer has reached the ‘.’ character. Then the newly created file_name_no_extension is appended an end of string character “\0” indicating the termination of the loop and end of the file name. This new file name is then returned by the function.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/13.jpg" | relative_url }}" />

- unsigned long long int get_folder_name( char * _path, int _size) — This function has two parameters _path, indicating the path to the folder and _size, indicating the length of the path string. For example /home/user/.config/telegram_bot/123456789/will be the _path parameter and 42 will be its length. The function starts from the end of the string skipping the last 2 characters. Then we loop the string until we have encountered a ”/” character indicating that the directory name has been fully looped through. On each iteration we reduce the current character value by 48 [the ASCII number for the ‘0’ character] producing an integer value corresponding to its character. On each iteration we also multiply the base by 10 and add the sum to the result, namely getting the 10th place 100th place 1000th place .. number and summing them all together.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/14.jpg" | relative_url }}" />

## The main.cpp Program

The main.cpp file contains the execution sequence of the designed architecture. The sequence of function execution is broken up into several parts.

Firstly, we pass 2 arguments to the main program: the path to the directory containing the files that are going to be watched by each child process and a verbosity parameter. The directory that is being passed as the 1st argument must be named after the desired chat id to which the Telegram Bot will send the messages. For example /home/user/.config/telegram_bot/123456789/is a valid path and /home/user/.config/telegram_bot/chatBot100/ is NOT a valid path.

Secondly, before compiling the program, please make sure that the token variable is set to the the desired Telegram Bots’ token. Otherwise, there will be no communication with the Telegram API.

Afterwards the program continues its execution by converting the chat id folder name to a long long integer and storing its value inside the _chat_id variable. Then the files under that specific directory are listed inside the _files directory_files structure.

Consequently, the program enters a for loop looping over the number of files inside the directory. We pass each filename through the function that reduces the passed string value to only a file name without any extensions. Then we get the last_modified_timestamp flag of the current file and create an environment variable with this value.

Finally, a new process is forked for the current file name and assigned the recently created environment variable. From this point on the child process enters the while loop inside the send_message_to_chat() function and the parent process continues looping through the files and spawning child processes.

[ Note ] When looping through the files in the directory_files structure, the increment is not 1, rather than the predefined SIZE_FILE_NAME.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/15.jpg" | relative_url }}" />

[ Note ] In order to compile the program correctly, you need to have the TgBot, Boost system, SSL, Cryptography and Threading libraries installed on your system and point the library files to the compiler.

```bash
g++ main.cpp config.h config.cpp -o telegram_bot --std=c++11 -I/usr/local/include -lTgBot -lboost_system -lssl -lcrypto -lpthread
```


# (Code) System Manager module

In the System Manager module we create a simple systemd service that is going to execute our already compiled Telegram Bot executable. The executable has 2 parameters, as we already discussed, these parameters are the directory which stores the resource files and a verbosity flag.

[ Note ] Make sure to have KillMode= set to process. This is not recommended in regular process management, but here this is the simplest solution to stopping the service with just one command.

If set to process, only the main process itself is killed (not recommended!)

For more information please visit this link.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/16.jpg" | relative_url }}" />

In order to stop/kill the service and all its CGroup processes use systemctl kill <telegram-bot.service>

# Final Results

The final product can be seen on the image below. Here I am showing how to start the Telegram Bot systemd service. This is also a demonstration of the response time of the Telegram Bot system when a particular file get modified.

We can conclude that this resource management system is quite reliable and robust.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/resource-management-system-in-c/2.gif" | relative_url }}" />