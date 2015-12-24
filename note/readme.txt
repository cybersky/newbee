@Tue Oct 27 2015 23:32:34 GMT+0800 (CST) by ihailong

1 把User Model声明从 mongo.js -> model/lawyer.js
2 咱以后model名都用单数
3 UserSchame 实际上应该是 LawyerSchema，回头我们用UserSchame来表示一般用户，可能还需要一个collection来存储运营人员（之前说的客户用户和管理员用户，有权限管理的，先放到一个表中就OK了，就叫operator）



