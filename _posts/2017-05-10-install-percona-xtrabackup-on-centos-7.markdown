---
layout: post
title: CentOS 7 下 MySQL 5.7 配置 Percona Xtrabackup
categories: [Linux]
tags: [centos, mysql, xtrabackup, yum]
summary: CentOS 7 下 MySQL 5.7 配置 Percona Xtrabackup，记录一下大致的安装和配置过程。
---
## 前言
CentOS 7 下 MySQL 5.7 配置 Percona Xtrabackup ，记录一下大致的安装和配置过程。

Percona XtraBackup 的备份工具支持热备份（即不必停止 MySQL 服务而进行备份）。热备份方式主要是通过文件系统级别的文件拷贝，当需要执行崩溃恢复时，可以实现数据集内的一致性。

参考 [How To Configure MySQL Backups with Percona XtraBackup on Ubuntu 16.04][2]

参考文档使用的操作系统为 Ubuntu 16.04，本例将操作系统改为 CentOS 7，命令基本一致，主要示例一下数据库的全备份，增量备份以及数据恢复。

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 7.3.1611 (Core)
```

MySQL 5.7

```terminal
$ mysql --version
mysql  Ver 14.14 Distrib 5.7.18, for Linux (x86_64) using  EditLine wrapper
```

本系统初始有两个用户  
超级管理员: root  
管理组用户: admin，本例中 `${USER}` 就是这个用户

## 安装 Percona Xtrabackup 工具

参考 [Installing Percona XtraBackup on Red Hat Enterprise Linux and CentOS][1]

安装 yum 源

```terminal
$ sudo yum install http://www.percona.com/downloads/percona-release/redhat/0.1-4/percona-release-0.1-4.noarch.rpm
```

查询一下安装包

```terminal
$ sudo yum list | grep xtrabackup
percona-xtrabackup.x86_64                  2.3.8-1.el7                 percona-release-x86_64
percona-xtrabackup-22.x86_64               2.2.13-1.el7                percona-release-x86_64
percona-xtrabackup-22-debuginfo.x86_64     2.2.13-1.el7                percona-release-x86_64
percona-xtrabackup-24.x86_64               2.4.7-1.el7                 percona-release-x86_64
percona-xtrabackup-24-debuginfo.x86_64     2.4.7-1.el7                 percona-release-x86_64
percona-xtrabackup-debuginfo.x86_64        2.3.8-1.el7                 percona-release-x86_64
percona-xtrabackup-test.x86_64             2.3.8-1.el7                 percona-release-x86_64
percona-xtrabackup-test-22.x86_64          2.2.13-1.el7                percona-release-x86_64
percona-xtrabackup-test-24.x86_64          2.4.7-1.el7                 percona-release-x86_64
```

安装 `Xtrabackup` 和 `qpress` 压缩工具。

```terminal
$ sudo yum update
$ sudo yum install percona-xtrabackup-24 qpress
```

安装之后，`innobackupex`, `xtrabackup`, `xbstream`, 和 `qpress` 命令将可以使用，本例的脚本会使用这些命令进行数据的备份和恢复。

### 配置一个 MySQL 备份用户并且添加测试数据

首先使用 MySQL 的 `root` 用户登录。

```terminal
$ mysql -u root -p
```

#### 创建一个 MySQL 用户并且授权

在 MySQL 中创建一个用户名为 `backup` 的用户，并且分配备份的相关权限给它。

```terminal
mysql> CREATE USER 'backup'@'localhost' IDENTIFIED BY 'password';
```

授予备份的相关权限

```terminal
mysql> GRANT RELOAD, LOCK TABLES, REPLICATION CLIENT, CREATE TABLESPACE, PROCESS, SUPER, CREATE, INSERT, SELECT ON *.* TO 'backup'@'localhost';
mysql> FLUSH PRIVILEGES;
```

创建测试数据，创建一个 playground 的数据库，创建一个 equipment 的表，并且添加一条记录到这个表里。

```terminal
mysql> CREATE DATABASE playground;
mysql> CREATE TABLE playground.equipment ( id INT NOT NULL AUTO_INCREMENT, type VARCHAR(50), quant INT, color VARCHAR(25), PRIMARY KEY(id));
mysql> INSERT INTO playground.equipment (type, quant, color) VALUES ("slide", 2, "blue");
```

此后我们将用这个数据库查看测试备份和恢复的效果。

```terminal
mysql> SELECT * FROM playground.equipment;
+----+-------+-------+-------+
| id | type  | quant | color |
+----+-------+-------+-------+
|  1 | slide |     2 | blue  |
+----+-------+-------+-------+
1 row in set (0.00 sec)
```

在我们退出 MySQL 会话前，我们先检查一下 `datadir` 变量。因为我们还要创建一个操作系统的 `backup` 用户，而且这个需要有权限访问这个目录。

```terminal
mysql> SELECT @@datadir;
+-----------------+
| @@datadir       |
+-----------------+
| /var/lib/mysql/ |
+-----------------+
1 row in set (0.00 sec)
```

记住这个目录，现在可以退出 MySQL 了。

```terminal
mysql> exit
Bye
```

#### 配置操作系统的备份用户并授权

创建 backup 用户，不需要登录系统，没有 home 目录

```terminal
$ sudo useradd -M -s /sbin/nologin backup
```

确认一下 backup 用户和组

```terminal
$ grep backup /etc/passwd /etc/group
/etc/passwd:backup:x:1001:1001::/home/backup:/sbin/nologin
/etc/group:backup:x:1001:
```

MySQL 的数据目录 `/var/lib/mysql` 的所有者和所有组是 `mysql`。

1. 我们需要将 backup 加入到 mysql 组里，这样 backup 就可以访问 mysql 组的目录和文件。
2. 我们需要将 `sudo` 加入到 backup 组里，这样我们就可以访问 backup 用户和组权限的目录和文件。

命令执行如下

```terminal
$ sudo usermod -aG mysql backup
$ sudo usermod -aG backup ${USER}
```

此时我们再检查一下 backup 的组

```terminal
$ grep backup /etc/group
mysql:x:27:backup
backup:x:1001:admin
```

新加入的组不会立即生效，需要执行如下命令

```terminal
$ exec su - ${USER}
```

执行之后，可以使用如下命令确认

```terminal
$ id -nG
admin wheel backup
```

> 注意： `admin` 是 admin 的组，`wheel` 是 CentOS 默认的 sudo 组，`backup` 是新增的 mysql 备份的组。

### 创建备份相关的资源

现在我们已经有了 Mysql 用户 `backup`, 系统用户 `backup`，我们需要创建配置文件，密钥文件和其他脚本，这样我们就可以创建并保护备份的安全。

#### 创建 MySQL 备份的配置文件

我们将 MySQL 备份用户 `backup` 的用户名和密码放到配置中。

```terminal
$ sudo mkdir /etc/mysql
$ sudo vi /etc/mysql/backup.cnf
```

加入如下内容：

```conf
[client]
user=backup
password=password	
```

保存并退出 `:wq`，这样 MySQL 的配置文件就创建完毕，以后备份用户就会使用这个文件的配置登录 MySQL ，注意 `password=password` 这个密码是 MySQL 里面的用户 `backup` 的密码。

#### 创建备份的根目录
本例使用 `/backups/mysql` 为备份文件的根目录，使用如下命令创建：

```terminal
$ sudo mkdir -p /backups/mysql
```

对这个目录的所有者和所有组进行分配, 所有者为 backup，所有组为 mysql

```
$ sudo chown backup:mysql /backups/mysql
```

CentOS 7 默认启用了 SELinux，这也需要进行授权，可以先查看一下

```terminal
$ ls -lh -Zd /backups/mysql/
drwxr-x--x. backup mysql unconfined_u:object_r:var_lib_t:s0 /backups/mysql/
```

授权命令如下: 只更改类型即可

```terminal
$ sudo chcon -R -u system_u -t mysqld_db_t /backups/mysql/
```

查看一下

```terminal
$ ls -lh -Zd /backups/mysql/
drwxr-x--x. backup mysql system_u:object_r:mysqld_db_t:s0 /backups/mysql/
```

此时，SELinux 授权完成。

这样 backup 用户就可以进入并操作这个目录了

#### 创建密钥保护备份文件安全

因为数据库文件是非常重要的文件，所以安全非常重要。 `innobackupex` 工具提供了加密和解密的功能。为此，我们只需要提供一个密钥即可。

我们使用 `openssl` 命令来创建一个密钥

```terminal
$ printf '%s' "$(openssl rand -base64 24)" | sudo tee /backups/mysql/encryption_key && echo
```

修改这个文件的权限，保证这个文件只能 `backup` 用户可以使用。

```terminal
$ sudo chown backup:backup /backups/mysql/encryption_key
$ sudo chmod 600 /backups/mysql/encryption_key
```

#### 创建备份和恢复的脚本
目前安全方面的准备已经完成，我们需要创建 3 个脚本，来执行备份（加密备份），释放（解密）和恢复准备的工作。

- `backup-mysql.sh`: 这个脚本完成备份数据库，对备份的文件进行加密和压缩，他会根据日期创建全量和增量的备份，默认保存 3 天的备份。 
- `extract-mysql.sh`: 这个脚本会解压并解密备份文件，并将文件放到指定的文件夹中。
- `prepare-mysql.sh`: 这个脚本为恢复做最后的准备，将增量文件合并到全备份中。并且记录执行的日志，如果这个脚本执行完，那么剩下的就是将恢复的数据库替换即可。

#### 创建 backup-mysql.sh 脚本

```terminal
$ sudo vi /usr/local/bin/backup-mysql.sh
```

脚本内容如下：

```shell
#!/bin/bash
	
export LC_ALL=C
	
days_of_backups=3  # Must be less than 7
backup_owner="backup"
parent_dir="/backups/mysql"
defaults_file="/etc/mysql/backup.cnf"
todays_dir="${parent_dir}/$(date +%a)"
log_file="${todays_dir}/backup-progress.log"
encryption_key_file="${parent_dir}/encryption_key"
now="$(date +%m-%d-%Y_%H-%M-%S)"
processors="$(nproc --all)"
	
# Use this to echo to standard error
error () {
    printf "%s: %s\n" "$(basename "${BASH_SOURCE}")" "${1}" >&2
    exit 1
}
	
trap 'error "An unexpected error occurred."' ERR
	
sanity_check () {
    # Check user running the script
    if [ "$USER" != "$backup_owner" ]; then
        error "Script can only be run as the \"$backup_owner\" user"
    fi
	
    # Check whether the encryption key file is available
    if [ ! -r "${encryption_key_file}" ]; then
        error "Cannot read encryption key at ${encryption_key_file}"
    fi
}
	
set_options () {
    # List the innobackupex arguments
    #declare -ga innobackupex_args=(
    innobackupex_args=(
        "--defaults-file=${defaults_file}"
        "--extra-lsndir=${todays_dir}"
        "--compress"
        "--stream=xbstream"
        "--encrypt=AES256"
        "--encrypt-key-file=${encryption_key_file}"
        "--parallel=${processors}"
        "--compress-threads=${processors}"
        "--encrypt-threads=${processors}"
        "--slave-info"
        "--incremental"
    )
	
    backup_type="full"
	
    # Add option to read LSN (log sequence number) if a full backup has been
    # taken today.
    if grep -q -s "to_lsn" "${todays_dir}/xtrabackup_checkpoints"; then
        backup_type="incremental"
        lsn=$(awk '/to_lsn/ {print $3;}' "${todays_dir}/xtrabackup_checkpoints")
        innobackupex_args+=( "--incremental-lsn=${lsn}" )
    fi
}
	
rotate_old () {
    # Remove the oldest backup in rotation
    day_dir_to_remove="${parent_dir}/$(date --date="${days_of_backups} days ago" +%a)"
	
    if [ -d "${day_dir_to_remove}" ]; then
        rm -rf "${day_dir_to_remove}"
    fi
}
	
take_backup () {
    # Make sure today's backup directory is available and take the actual backup
    mkdir -p "${todays_dir}"
    find "${todays_dir}" -type f -name "*.incomplete" -delete
    innobackupex "${innobackupex_args[@]}" "${todays_dir}" > "${todays_dir}/${backup_type}-${now}.xbstream.incomplete" 2> "${log_file}"
	
    mv "${todays_dir}/${backup_type}-${now}.xbstream.incomplete" "${todays_dir}/${backup_type}-${now}.xbstream"
}
	
sanity_check && set_options && rotate_old && take_backup
	
# Check success and print message
if tail -1 "${log_file}" | grep -q "completed OK"; then
    printf "Backup successful!\n"
    printf "Backup created at %s/%s-%s.xbstream\n" "${todays_dir}" "${backup_type}" "${now}"
else
    error "Backup failure! Check ${log_file} for more information"
fi
```

这个脚本完成了如下功能：

- 每天第一次运行时创建一个加密的压缩的全备份
- 第二次执行时，会创建加密的压缩的增量备份
- 维护全备份的历史默认保留 3 天的全备份和增量备份，如需修改天数，请自行修改本脚本。

当这个脚本执行，一个日期的文件夹会被创建，如果是第一次备份，文件名以 `full-` 开头，表示全备份，从第二次开始，文件名以 `incremental-` 开头，表示增量备份，文件名后面代表备份时的系统时间。

脚本执行后，会生成一个文件名为 `backup-progress.log` 的日志文件，如有问题，可以查看。还有一个 `xtrabackup_checkpoints` 文件，用于存储备份时的元数据，这个文件不能删除，因为下一次创建增量备份时需要用到这里的参数。

创建完成后，保存这个文件，并更改这个脚本为可执行

```terminal
$ sudo chmod +x /usr/local/bin/backup-mysql.sh
```

#### 创建 extract-mysql.sh 脚本

```terminal
$ sudo vi /usr/local/bin/extract-mysql.sh
```

脚本内容如下：

```shell
#!/bin/bash
	
export LC_ALL=C
	
backup_owner="backup"
encryption_key_file="/backups/mysql/encryption_key"
log_file="extract-progress.log"
number_of_args="${#}"
processors="$(nproc --all)"
	
# Use this to echo to standard error
error () {
    printf "%s: %s\n" "$(basename "${BASH_SOURCE}")" "${1}" >&2
    exit 1
}
	
trap 'error "An unexpected error occurred.  Try checking the \"${log_file}\" file for more information."' ERR
	
sanity_check () {
    # Check user running the script
    if [ "${USER}" != "${backup_owner}" ]; then
        error "Script can only be run as the \"${backup_owner}\" user"
    fi
	
    # Check whether the qpress binary is installed
    if ! command -v qpress >/dev/null 2>&1; then
        error "Could not find the \"qpress\" command.  Please install it and try again."
    fi
	
    # Check whether any arguments were passed
    if [ "${number_of_args}" -lt 1 ]; then
        error "Script requires at least one \".xbstream\" file as an argument."
    fi
	
    # Check whether the encryption key file is available
    if [ ! -r "${encryption_key_file}" ]; then
        error "Cannot read encryption key at ${encryption_key_file}"
    fi
}
	
do_extraction () {
    for file in "${@}"; do
        base_filename="$(basename "${file%.xbstream}")"
        restore_dir="./restore/${base_filename}"
	
        printf "\n\nExtracting file %s\n\n" "${file}"
	
        # Extract the directory structure from the backup file
        mkdir --verbose -p "${restore_dir}"
        xbstream -x -C "${restore_dir}" < "${file}"
	
        innobackupex_args=(
            "--parallel=${processors}"
            "--decrypt=AES256"
            "--encrypt-key-file=${encryption_key_file}"
            "--decompress"
        )
	
        innobackupex "${innobackupex_args[@]}" "${restore_dir}"
        find "${restore_dir}" -name "*.xbcrypt" -exec rm {} \;
        find "${restore_dir}" -name "*.qp" -exec rm {} \;
	
        printf "\n\nFinished work on %s\n\n" "${file}"
	
    done > "${log_file}" 2>&1
}
	
sanity_check && do_extraction "$@"
	
ok_count="$(grep -c 'completed OK' "${log_file}")"
	
# Check the number of reported completions.  For each file, there is an
# informational "completed OK".  If the processing was successful, an
# additional "completed OK" is printed. Together, this means there should be 2
# notices per backup file if the process was successful.
if (( $ok_count !=  2 * $# )); then
    error "It looks like something went wrong. Please check the \"${log_file}\" file for additional information"
else
    printf "Extraction complete! Backup directories have been extracted to the \"restore\" directory.\n"
fi
```

这个脚本与 `backup-mysql.sh` 不能，这个脚本在希望恢复备份时使用。会提取（解压并解密）以 `xbstream ` 为后缀的文件。

这个脚本执行之后，会把提取后的文件放到 `restore` 文件夹下，包含当天的全备份文件和增量备份的文件。您可以自己分析，恢复到哪个时点。

创建完成后，保存这个文件，并更改这个脚本为可执行

```terminal
$ sudo chmod +x /usr/local/bin/extract-mysql.sh
```

#### 创建 prepare-mysql.sh 脚本
最后我们创建 `prepare-mysql.sh`，将确认后的增量备份合并到全量备份中，这样就生成了那个时点的数据库快照。

```terminal
$ sudo vi /usr/local/bin/prepare-mysql.sh
```

脚本内容如下：

```shell
#!/bin/bash
	
export LC_ALL=C
	
shopt -s nullglob
incremental_dirs=( ./incremental-*/ )
full_dirs=( ./full-*/ )
shopt -u nullglob
	
backup_owner="backup"
log_file="prepare-progress.log"
full_backup_dir="${full_dirs[0]}"
	
# Use this to echo to standard error
error() {
    printf "%s: %s\n" "$(basename "${BASH_SOURCE}")" "${1}" >&2
    exit 1
}
	
trap 'error "An unexpected error occurred.  Try checking the \"${log_file}\" file for more information."' ERR
	
sanity_check () {
    # Check user running the script
    if [ "${USER}" != "${backup_owner}" ]; then
        error "Script can only be run as the \"${backup_owner}\" user."
    fi
	
    # Check whether a single full backup directory are available
    if (( ${#full_dirs[@]} != 1 )); then
        error "Exactly one full backup directory is required."
    fi
}
	
do_backup () {
    # Apply the logs to each of the backups
    printf "Initial prep of full backup %s\n" "${full_backup_dir}"
    innobackupex --redo-only --apply-log "${full_backup_dir}"
	
    for increment in "${incremental_dirs[@]}"; do
        printf "Applying incremental backup %s to %s\n" "${increment}" "${full_backup_dir}"
        innobackupex --redo-only --apply-log --incremental-dir="${increment}" "${full_backup_dir}"
    done
	
    printf "Applying final logs to full backup %s\n" "${full_backup_dir}"
    innobackupex --apply-log "${full_backup_dir}"
}
	
sanity_check && do_backup > "${log_file}" 2>&1
	
# Check the number of reported completions.  Each time a backup is processed,
# an informational "completed OK" and a real version is printed.  At the end of
# the process, a final full apply is performed, generating another 2 messages.
ok_count="$(grep -c 'completed OK' "${log_file}")"
	
if (( ${ok_count} == 2 * (${#full_dirs[@]} + ${#incremental_dirs[@]} + 1) )); then
    cat << EOF
Backup looks to be fully prepared.  Please check the "prepare-progress.log" file
to verify before continuing.
	
If everything looks correct, you can apply the restored files.
	
First, stop MySQL and move or remove the contents of the MySQL data directory:
	
        sudo systemctl stop mysql
        sudo mv /var/lib/mysql/ /tmp/
	
Then, recreate the data directory and  copy the backup files:
	
        sudo mkdir /var/lib/mysql
        sudo innobackupex --copy-back ${PWD}/$(basename "${full_backup_dir}")
	
Afterward the files are copied, adjust the permissions and restart the service:
	
        sudo chown -R mysql:mysql /var/lib/mysql
        sudo find /var/lib/mysql -type d -exec chmod 750 {} \\;
        sudo systemctl start mysql
EOF
else
    error "It looks like something went wrong.  Check the \"${log_file}\" file for more information."
fi
```

这个脚本将在本目录查找以 `full-` 或 `incremental-` 为前缀的目录，使用 MySQL 的日志应用提交的事务到全量备份，之后再将增量备份的事务提交到全量备份中。

如果所有的备份都被结合，那么未被提交的事务将会回滚，这时，这个 `full-` 开头的全量备份文件夹，里面的数据，就是当时 MySQL 的数据文件。

创建完成后，保存这个文件，并更改这个脚本为可执行

```terminal
$ sudo chmod +x /usr/local/bin/prepare-mysql.sh 
```

### 测试这个 MySQL 的备份和恢复脚本

#### 创建一个全备份
使用 backup 用户执行 `backup-mysql.sh`

```terminal
$ sudo -u backup /usr/local/bin/backup-mysql.sh
Backup successful!
Backup created at /backups/mysql/Wed/full-05-10-2017_17-16-44.xbstream
```

如果一切顺利，输出会看到 `Backup successful!`，这样创建了一个当天的文件夹(本例为 `Wed`)，并且创建了一个以 `full-` 开头的全量备份。

让我们进入这个目录看一下

```terminal
$ cd /backups/mysql/"$(date +%a)"
$ ls
backup-progress.log  full-05-10-2017_17-16-44.xbstream  xtrabackup_checkpoints
```

如上 `backup-progress.log`，为日志文件，我们看一下他的内容

```terminal
$ tail backup-progress.log
170510 17:16:46 All tables unlocked
170510 17:16:46 [00] Compressing, encrypting and streaming ib_buffer_pool to <STDOUT>
170510 17:16:46 [00]        ...done
170510 17:16:46 Backup created in directory '/backups/mysql/Wed/'
170510 17:16:46 [00] Compressing, encrypting and streaming backup-my.cnf
170510 17:16:46 [00]        ...done
170510 17:16:46 [00] Compressing, encrypting and streaming xtrabackup_info
170510 17:16:46 [00]        ...done
xtrabackup: Transaction log of lsn (2541849) to (2541858) was copied.
170510 17:16:46 completed OK!
```

看到 `completed OK!`，表示备份没有问题。

在看一下 `xtrabackup_checkpoints` 的内容

```terminal
$ cat xtrabackup_checkpoints
backup_type = full-backuped
from_lsn = 0
to_lsn = 2541849
last_lsn = 2541858
compact = 0
recover_binlog_info = 0
```

这个例子表示，全备份是将日志序列号 log sequence number (LSN) 从起始点(from_lsn) 0 到终止点(to_lsn) 2541849 的备份。 last_lsn 表示当执行备份操作到的日志序列号。


#### 创建一个增量备份
全备份创建之后，下一次创建的是增量备份，它依赖这个全备份，再一次创建增量备份时依赖的就是上次的增量备份了，这是一种链式依赖。

本例添加一些数据到数据库，这样更好感受效果。

```
$ sudo mysql -u root -p -e 'INSERT INTO playground.equipment (type, quant, color) VALUES ("swing", 10, "yellow");'
```

再次执行 `backup-mysql.sh`，就会创建增量备份。

```terminal
$ sudo -u backup /usr/local/bin/backup-mysql.sh
```

我们查看一下

```terminal
$ cd /backups/mysql/"$(date +%a)"
$ ls
backup-progress.log  full-05-10-2017_17-16-44.xbstream  
incremental-05-10-2017_18-39-39.xbstream  xtrabackup_checkpoints
```

此时查看一下 `xtrabackup_checkpoints`

```terminal
$ cat xtrabackup_checkpoints
backup_type = incremental
from_lsn = 2541849
to_lsn = 2542208
last_lsn = 2542217
compact = 0
recover_binlog_info = 0
```

此时 from_lsn 已经是上次（本例为第一次备份）的 to_lsn 了，from_lsn 是 0 的时候，表示是全备份，不为 0 就是增量备份了。

#### 提取备份
接下来，我们要提取备份文件到本分文件夹。

```terminal
$ sudo -u backup /usr/local/bin/extract-mysql.sh *.xbstream
Extraction complete! Backup directories have been extracted to the "restore" directory.
```

看到 `Extraction complete!` 表示提取完毕。  
这个脚本会生成一个 `restore` 目录 和 `extract-progress.log` 日志文件。

查看一下 `extract-progress.log`

```terminal
$ tail extract-progress.log
170510 18:47:02 [01] decrypting and decompressing ./xtrabackup_logfile.qp.xbcrypt
170510 18:47:02 [01] decrypting ./xtrabackup_checkpoints.xbcrypt
170510 18:47:02 [01] decrypting and decompressing ./ib_buffer_pool.qp.xbcrypt
170510 18:47:02 [01] decrypting and decompressing ./backup-my.cnf.qp.xbcrypt
170510 18:47:02 [01] decrypting and decompressing ./xtrabackup_info.qp.xbcrypt
170510 18:47:02 completed OK!
	
	
Finished work on incremental-05-10-2017_18-39-39.xbstream
```

我们进入 `restore` 目录，备份文件已经准备就绪。

```
$ cd restore
$ ls -F
full-05-10-2017_17-16-44/  incremental-05-10-2017_18-39-39/
```

这是备份文件，但是还不是 MySQL 的数据文件。为达到最后的目的，我们开始准备文件。

#### 准备文件
接下来，我们将合并这些文件。
- 我们必须在 `restore` 文件夹下执行这个脚本
- 这个文件夹下包含 `full-` 和 `incremental-` 的备份文件夹，如果我们不想恢复某些增量备份，请删除这些 `incremental-` 文件夹。

恢复命令如下（*注意* 要在 `restore` 目录下执行这个命令）

```terminal
$ sudo -u backup /usr/local/bin/prepare-mysql.sh
Backup looks to be fully prepared.  Please check the "prepare-progress.log" file
to verify before continuing.
	
If everything looks correct, you can apply the restored files.
	
First, stop MySQL and move or remove the contents of the MySQL data directory:
	
        sudo systemctl stop mysql
        sudo mv /var/lib/mysql/ /tmp/
	
Then, recreate the data directory and  copy the backup files:
	
        sudo mkdir /var/lib/mysql
        sudo innobackupex --copy-back /backups/mysql/Wed/restore/full-05-10-2017_17-16-44
	
Afterward the files are copied, adjust the permissions and restart the service:
	
        sudo chown -R mysql:mysql /var/lib/mysql
        sudo find /var/lib/mysql -type d -exec chmod 750 {} \;
        sudo systemctl start mysql
```

这表示准备完成了，脚本会输出一些接下来恢复数据库的步骤

#### 还原备份数据到 MySQL 数据目录
首先，停止 MySQL 服务

```terminal
$ sudo systemctl stop mysqld
```

因为备份目录与 MySQL 的数据目录可能有冲突，我们需要删除或剪切 `/var/lib/mysql` 目录

```terminal
$ sudo mv /var/lib/mysql/ /tmp
```

重新创建 `/var/lib/mysql` 目录，之后赋予正确的权限

```terminal
$ sudo mkdir /var/lib/mysql
```

现在，我们要使用 `innobackupex` 将备份文件拷贝到 MySQL 的数据目录

```terminal
$ sudo innobackupex --copy-back /backups/mysql/Wed/restore/full-05-10-2017_17-16-44/

170510 19:04:22 innobackupex: Starting the copy-back operation

IMPORTANT: Please check that the copy-back run completes successfully.
           At the end of a successful copy-back run innobackupex
           prints "completed OK!".
	
innobackupex version 2.4.7 based on MySQL server 5.7.13 Linux (x86_64) (revision id: 6f7a799)
......
......
170510 19:04:33 completed OK!
```

执行之后，`completed OK!` 说明拷贝完成，一旦文件已经就位，我们需要将修复所有者和权限，这样 MySQL 的用户和组就可以访问了。

```terminal
$ sudo chown -R mysql:mysql /var/lib/mysql
```

因为 CentOS 7 默认启用了 SELinux，这也需要进行授权，可以先查看一下

```terminal
$ ls -lh -Zd /var/lib/mysql
drwxr-x--x. mysql mysql unconfined_u:object_r:var_lib_t:s0 /var/lib/mysql
```

授权命令如下: 更改类型和用户的属性

```terminal
$ sudo chcon -R -t mysqld_db_t /var/lib/mysql
$ sudo chcon -u system_u /var/lib/mysql
```

查看一下

```terminal
$ ls -lh -Zd /var/lib/mysql
drwxr-x--x. mysql mysql system_u:object_r:mysqld_db_t:s0 /var/lib/mysql
```

此时，SELinux 的权限已经恢复完全。

启动 MySQL 服务，完成数据恢复。

```terminal
$ sudo systemctl start mysqld
```

如果数据库启动顺利，接下来，我们查询一下数据库，验证一下数据是否恢复

```terminal
$ sudo mysql -u root -p -e 'SELECT * FROM playground.equipment;'
Enter password: 
+----+-------+-------+--------+
| id | type  | quant | color  |
+----+-------+-------+--------+
|  1 | slide |     2 | blue   |
|  2 | swing |    10 | yellow |
+----+-------+-------+--------+
```

由此可以看到，数据顺利恢复了。

数据恢复完成之后，还要注意一个非常重要的事情，我们需要删除 `restore` 目录，因为新的增量备份，不能使用本次的结果文件，而且没有加密的备份文件，保存在磁盘也不安全。

```terminal
$ cd ~
$ sudo rm -rf /backups/mysql/"$(date +%a)"/restore
```

下一次恢复，我们需要重新执行 `extract-mysql.sh` 脚本，生成 `restore` 目录，并执行 `prepare-mysql.sh` 准备数据。

### 创建 Cron 作业每小时增量备份
我们手工执行的 `backup-mysql.sh` 可以创建作业，定时（每小时）执行。

```terminal
$ sudo vi /etc/cron.hourly/backup-mysql
```

输入如下内容

```shell	
#!/bin/bash
sudo -u backup systemd-cat --identifier=backup-mysql /usr/local/bin/backup-mysql.sh
```

保存并关闭 `:wq`，让这个脚本可以执行

```terminal
$ sudo chmod +x /etc/cron.hourly/backup-mysql
```

这个脚本将每小时执行一次，并且自动清除 3 天以前的备份。

我们可以手动测试一下 cron 脚本

```terminal
$ sudo /etc/cron.hourly/backup-mysql
```

执行完之后，我们可以使用 journal 命令查看一下日志

```terminal
$ sudo journalctl -t backup-mysql
-- Logs begin at Wed 2017-05-10 18:28:55 CST, end at Wed 2017-05-10 19:27:58 CST. --
May 10 19:27:13 bogon backup-mysql[6704]: Backup successful!
May 10 19:27:13 bogon backup-mysql[6704]: Backup created at /backups/mysql/Wed/incremental-05-10-2017_19-27-11.xbstream
```

## 结束语
本例使用了 `xtrabackup` 工具，进行了 MySQL 的热备份和恢复

- 全备份和增量备份
- 提取备份文件
- 恢复数据

## 参考资料
[Installing Percona XtraBackup on Red Hat Enterprise Linux and CentOS][1]  
[How To Configure MySQL Backups with Percona XtraBackup on Ubuntu 16.04][2]  
[How To Create Hot Backups of MySQL Databases with Percona XtraBackup on CentOS 7][3]
 
[1]: https://www.percona.com/doc/percona-xtrabackup/2.2/installation/yum_repo.html
[2]: https://www.digitalocean.com/community/tutorials/how-to-configure-mysql-backups-with-percona-xtrabackup-on-ubuntu-16-04
[3]: https://www.digitalocean.com/community/tutorials/how-to-create-hot-backups-of-mysql-databases-with-percona-xtrabackup-on-centos-7
