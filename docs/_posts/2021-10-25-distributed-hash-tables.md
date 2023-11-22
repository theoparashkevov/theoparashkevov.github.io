---
layout: post
title: Data Structures - Distributed Hash Tables
author:
- Teo Parashkevov
meta: [data structures, hash, table]
usemathjax: true
thumbnail_location: distributed-hash-tables
description: A clarification on some of the concepts and properties regarding Distributed hash tables (DHT)
---

# Introduction

With the rise of cryptocurrencies in recent years, the topic of “Decentralization” in general has gained a substantial amount of popularity. As decentralization finds its way into the vocabulary of more and more people with enthusiasm for technology, the greater the probability for those people to become misinformed about the underlying concepts in that particular technology. These topics should be handles with care, they are not something that can be explained in a ~10 min. video, therefore a substantial amount of determination and logical robustness is required from the consumer of such information.

In this article, I will try to explain the concept of Distributed Hash Table and will present the advantages and disadvantages of implementing such structures in software systems.

# Concept of a DHT

(Wikipedia)[https://en.wikipedia.org/wiki/Distributed_hash_table]: A distributed hash table (DHT) is a distributed system that provides a lookup service similar to a hash table: key-value pairs are stored in a DHT, and any participating node can efficiently retrieve the value associated with a given key. The main advantage of a DHT is that nodes can be added or removed with minimum work around re-distributing keys. Responsibility for maintaining the mapping from keys to values is distributed among the nodes, in such a way that a change in the set of participants causes a minimal amount of disruption. This allows a DHT to scale to extremely large numbers of nodes and to handle continual node arrivals, departures, and failures.

A Distributed Hash Table is a decentralized data store that looks up data based on key-value pairs. Every node in a DHT is responsible for a set of keys and their associated values/resources. A key may be assigned to a hash value of a specific variable or the hashed contents of a particular file resource on the system. Furthermore, the key is a unique identifier for its associated data value, which can be any form of data [file, variable, etc.], created by running the value through a hashing function. A node may be responsible for one or many keys, depending on the architecture of the network of nodes.

# Properties of DHT

- **Autonomy and decentralization** — nodes collectively form the system without any central coordination.
- **Fault tolerance** — the system should be reliable (in some sense) even with nodes continuously joining, leaving, and failing
- **Scalability** — the system should function efficiently even with thousands or millions of nodes.

# Advantages of DHT

- <span class="span-yellow"> Resilience to change in active node number </span> — It’s highly resilient to network leavers/joiners or other big changes around the network; changes in the number of active nodes is handled very well by the network.
- <span class="span-yellow"> Automatic data distribution </span> — Data is automatically distributed, according to specific configuration options. The specific way how data is eventually organized depends on the chosen strategy in the design.
- <span class="span-yellow"> Data loss resilience </span> — Data is replicated across nodes, so it’s difficult to have a permanent loss of a particular set of data, but not impossible.
- <span class="span-yellow"> Decentralization </span> — There is no central entity responsible for data management and query handling.

# Disadvantages of DHT

- <span class="span-yellow"> Probable data loss </span> — The probability of data loss exists as DHT doesn’t provide absolute guarantees on data consistency and integrity.
- <span class="span-yellow"> Decentralization </span> — There is no authority in the network that can handle and prioritize queries, which can lead to network overload.
- <span class="span-yellow"> Speed of a query </span> — the speed of a particular query depends on the specific architectural implementation of DHT; It can range from O(n) to O(logN)


## Advantages of DHT:
1. <span class="span-blue"> __Resilience to change in active node number__ </span>
2. <span class="span-blue"> __Automatic data distribution__ </span>
3. <span class="span-blue"> __Data loss resilience__ </span>
4. <span class="span-blue"> __Decentralization__ </span>

## Disadvantages of DHT:
1. <span class="span-red"> __Probable data loss__ </span>
2. <span class="span-red"> __Decentralization__ </span>
3. <span class="span-red"> __Speed of a query__ </span>


# Example

## Creating the network; Assigning Node IDs

In this example we will create a DHT with 8 Nodes. These 8 nodes will be connected, such that the network forms conceptually a “circle” starting from the first node. Each node will be assigned an ID from the following array of IDs {10, 20, 30, 40, 50, 60 ,70, 80 }. The first Node will have an ID of 10, the second; an ID of 20 and so forth. (Fig. 1)

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/1.jpg" | relative_url }}" />

Each Node will have a successor (the node immediately after the current node that is connected in the network i.e. the next node) and a predecessor (the node immediately before the current node that is connected in the network i.e. the previous node). (Fig. 2)

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/2.jpg" | relative_url }}" />


## Resource assignment based on Node ID

Let us consider that the main purpose of the DHT in this example is to store the contents of a particular set of files. The specific content of each file does not matter for this example, however I would like to use file contents in order to make the example seem closer to a real world problem.

Suppose that we have 8 files that contain very important information; file1, tile2, … In a normal Hash table we would either hash the absolute path to the file, or the relative path to the file, or even hash all the file contents. Regardless of the choice, the output of the hash will be the “key” in the key-value pair in our hash table. In this example, for simplicity reasons, the output of our hashed files will be the following array of keys {15, 25, 35, 45, 55, 65, 75, 85}. (Fig. 3)

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/3.jpg" | relative_url }}" />

Now that the key-value pair is available, a “resource distribution” scheme must be chosen. In this example I will keep things simple and will chose the resource distribution rule to be as follows:

“Resource with key N will be managed by Node with ID M, where M < N and M is the biggest ID number in the set”

[ Note ] If there is a resource with N=25 and you have 3 Nodes with IDs 10 20 and 30, this particular resource will be managed by the Node with ID M = 20, not 30 because its > 25 and not 10, because 20 exists and is > 10.

Creating this simple DHT can be seen on Fig. 4.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/4.jpg" | relative_url }}" />

## Removing a Node from the network

In order to remove a node from the network, first what needs to be decided is where its key is going to be stored after the removal of the node. If we want to remove the node with ID 80, we need to assign its currently stored key (85) to some other node. In this example we will follow a basic rule, that says that when removing a node, all its stored keys shall be assigned to its successor.

[ Note ] This rule was arbitrary chosen for this example, there are many other ways to manage key of nodes that are going to be removed in the future.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/5.jpg" | relative_url }}" />

Therefore, in the process of removing node 80, node 10 will be additionally assigned key 85, hence after the removal of node 80, node 10 will store key 15 and key 85. (Fig. 5)(Fig. 6)

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/6.jpg" | relative_url }}" />

## Adding a Node to the network

When a new node wants to join the DHT network, depending on its position relative to who is its successor/predecessor, the node will acquire a different key. In this example, we will bring back the Node with ID 80 inside the DHT network. The constrain that we will use in this example is that, if on leaving, a nodes key was assigned to its successor, then when bringing that node inside the network, the new node will acquire a new key from its predecessor, relative to its new position.

[ Note ] Here I am not applying the rule “Resource with key N will be managed by Node with ID M, where M < N and M is the biggest ID number in the set”. If we had to apply this rule, there would be only one correct position for a node with ID 80

Following the above declared rule, we get 7 possible positions, marked with green, for Node 80. We can observe that relative to the position of the node that needs to be inserted inside the network, the assigned key varies. When Node 80 goes between nodes 70 and 10, it will receive and be responsible for storing key 75; when Node 80 goes between nodes 10 and 20, it will receive and be responsible for either key 15 or 85. (Fig. 7)

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/7.jpg" | relative_url }}" />

## Querying the network for a particular resource - O(n)

When performing a query for a specific key on the network, the parameter with the greatest wight is “connectivity”. Connectivity here means the number of direct connections a node has to other nodes, i.e. how many successors / predecessors does a given node have.

[ Note ] In some cases, the number of predecessors does not signify great importance, simply because the term predecessor is only theoretically used for simplifying the concept of this particular data structure. In reality, a Distributed Hash Table can be implemented with little as a Linked List [Circular Linked List] composed of Node objects that contain fields for ID, Key and a successor pointer. Simply said, the term predecessor would be defined as so: The number of nodes that have their successor pointer pointing to a particular node. In this case, in our example each node would have only one node pointing to it, therefore only one predecessor. (only node 10 would be pointing to node 20, only node 20 would be pointing to node 30 …) This is not very practical, because of the fact that the direction in which the query would propagate would always be the same, therefore the complexity of this type of algorithm would stay constant.

Executing a query on the network, in this example, would have O(n) complexity. The reason for this is the following:

Let us consider that Node 10 would like to obtain the value for key 85. It first needs to locate where that particular resource is stored, i.e. Node 80. Initially Node 10 would query its successor with the theoretical question “Do you have key 85?”. If its successor, in this case Node 20. does not have key 85 it will continue asking this question to its successor and so on until Node 80 gets asked. This process illustrates the forward propagation of the query, shown on Fig 8. as red arrows.

Once Node 80 receives the query and confirms that it manages key 85, Node 80 would return the message to its caller. Namely, the query would propagate backwards to the initial node that sent it — Node 10.

Because we are traversing linearly through the whole network in both directions, the complexity of this implementation of a DHT is O(n).

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/8.jpg" | relative_url }}" />

## Querying the network for a particular resource - O(logN)

We saw in section for, that querying a network with linear architecture implementation has a significantly large complexity — O(n). In order to reduce this complexity we can add additional links / shortcuts to other nodes. Basically, a node would have an additional pointer named shortcut that would point to another, much more distant node. In our example, each node will have a shortcut to the (i+3)th node. (Node 10 would have a shortcut pointing to Node 40, Node 20 would have a shortcut pointing to Node 50 etc.) The shortcut implementation of this architecture is shown on Figure 9. The yellow lines represent shortcuts.

<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/9.jpg" | relative_url }}" />

Executing a query on the network, in this example, would have O(logN) complexity. The reason for this is the following:

Let us consider that Node 10 again would like to obtain the value for key 85. It first needs to locate where that particular resource is stored, i.e. Node 80. Now, depending on the specific implementation of this algorithm ( Chord ),the query would propagate in a different way.

However, in this example for the means of simplicity, we will say that the querying node would propagate through its shortcut, if and only if its successor does not have a direct connection to the node that contains the key that is being queried.

Namely, if Node 20 was directly connected to Node 80, then Node 10 would receive its information through Node 20. If Node 20 does not have a direct connection to Node 80, then Node 10 sends the query to propagate through Node 40 [its shortcut]

The query propagation process in this example would look like this. Node 10 sends an initial query asking “Do you have key 85?” to Node 20. Node 20 asks its successor, Node 30; Node 30 does not have key 85, therefore responds to Node 20 with this information; Node 20 tells Node 10 that none of its successors are responsible for key 85; Node 10 sends the query to its shortcut, Node 40; The same process is repeated for Node 40, until eventually the query ends up at Node 70, which is directly connected to Node 85, which is responsible for key 85. This process is illustrated using red arrows on Figure 10. After the node responsible for key 85 has been found the response travels back to Node 10 via the same route it took initially. The response rout is illustrated on Figure 10 using green arrows.


<img style="display: block; float: none; margin-left: auto; margin-right:auto;" src="{{ "/assets/img/posts/distributed-hash-tables/10.jpg" | relative_url }}" />

Because we are not traversing linearly through the whole network in both directions, the complexity of this implementation of a DHT is O(logN). Please, review the (Chord algorithm)[https://en.wikipedia.org/wiki/Chord_(peer-to-peer)] for a detailed explanation of this implementation.


# Software applications that use DHT

## Ethereum

Ethereum is a decentralized, open-source blockchain with smart contract functionality. Ether is the native cryptocurrency of the platform. Amongst cryptocurrencies, Ether is second only to Bitcoin in market capitalization. The node discovery protocol in the Ethereum blockchain network stack is based on a slightly modified implementation of Kademlia (DHT).

## I2P

The Invisible Internet Project (I2P) is an anonymous network layer that allows for censorship-resistant, peer-to-peer communication. Anonymous connections are achieved by encrypting the user’s traffic, and sending it through a volunteer-run network of roughly 55,000 computers distributed around the world. Given the high number of possible paths the traffic can transit, a third party watching a full connection is unlikely. The software that implements this layer is called an “I2P router”, and a computer running I2P is called an “I2P node”. I2P is free and open sourced, and is published under multiple licenses.


## The Tox protocol

Tox (protocol) is a peer-to-peer instant-messaging and video-calling protocol that offers end-to-end encryption, based on DHT. The stated goal of the project is to provide secure yet easily accessible communication for everyone.


## Oracle Coherence

Oracle Coherence is a Java-based distributed cache and in-memory data grid, intended for systems that require high availability, high scalability and low latency, particularly in cases that traditional relational database management systems provide insufficient throughput, or insufficient performance.

## Freenet

Freenet is a peer-to-peer platform for censorship-resistant, anonymous communication. It uses a decentralized distributed data store to keep and deliver information, and has a suite of free software for publishing and communicating on the Web without fear of censorship.