---
title: SSH login without a password
description: A step-by-step tutorial for automating the login process to a remote machine using SSH keys instead of a password.
pubDate: 2017-03-10
updatedDate: 2017-03-10
categories:
  - linux
tags:
  - linux
  - system administration
author: Teo Parashkevov
heroImage: /assets/img/posts/ssh-login-no-password/thumbnail.png
heroAlt: 'Title card reading "SSH on Linux: Connection without a password" over a dark purple background with a network of connected blue lines and nodes'
math: false
---

## Introduction

Logging in to a remote server using ssh by default requires administrators to authenticate themselves with the password of some user of the system that they are connecting to. This is troublesome, because it can expose not only the target system to security risks, but also accumulate a wastage of time.

## The Problem

Some of the most common problems when using SSH to login to a particular remote machine are:

- The password for that particular user gets forgotten
- The password is too long and leads to mistakes during input
- There exists the security flaw of a keylistener on the client machine which is connecting to the server
- It takes time to input the password. If you are a systems administrator and you have to input a ~16 character password every time you login to a particular machine it becomes a very tedious task to do.

## The Solution

Because of the nature of the SSH technology, especially under GNU/Linux systems, configuring a passwordless login is quite an easy task. The goal is for the remote machine to have the clients’ key for authentication locally and allow the machine with this particular key to access the machine without a requirement for a password input.

In order to accomplish this, you will need 2 programs: `ssh-keygen` and `ssh-copy-id`.

- Generate your local machine's key by running the `ssh-keygen` command in the terminal. It will ask for a storage location (default: `/home/current_user/.ssh`). Then you will be asked to input a passphrase, leave it empty! The output should look like this.

<img src="/assets/img/posts/ssh-login-no-password/1.png" alt="Terminal output of ssh-keygen: generating a public/private RSA key pair, prompting for the file location and an empty passphrase, then saving id_rsa and id_rsa.pub in /home/current_user/.ssh" width="567" height="118" loading="lazy" style="margin-inline: auto;" />

```bash
[ user@hostname ]$ ssh-keygen # generate key and store locally
```

- Copy the generated `id_rsa` to the remote machine using `ssh-copy-id`. Use the `-i` option to specify the `id_rsa` key and the `-p` option to specify the port to your remote machine.

<img src="/assets/img/posts/ssh-login-no-password/2.jpg" alt="Terminal output of ssh-copy-id -i id_rsa -p with a redacted port and user: it installs id_rsa.pub, asks for the server password once and reports that 1 key was added" width="720" height="138" loading="lazy" style="margin-inline: auto;" />

```bash
[ user@hostname ]$ ssh-copy-id -i id_rsa -p <port> <user>@<ssh_server>
```

- Connect

<img src="/assets/img/posts/ssh-login-no-password/3.jpg" alt="Terminal showing a custom alias for the ssh command logging straight into a Debian server without a password prompt and printing the login banner" width="720" height="178" loading="lazy" style="margin-inline: auto;" />

## Manual Configuration

If you do not have the `ssh-copy-id` program or you are concerned about the security of the file transfer during its execution, you can manually add the generated key on the server machine. The destination is `/home/remote_user/.ssh/authorized_keys`. Make sure that you are copying your public key (`id_rsa.pub`). Append the `id_rsa.pub` to the `authorized_keys` file.
