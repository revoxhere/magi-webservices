let username, password, address, captcha, captchainfo, email, passwordConfirm;
const api = "https://magi.duinocoin.com";
if (!window.location.href.includes("magi.duinocoin.com")) window.location.href = "https://magi.duinocoin.com/";

String.prototype.escape = function() {
    var tagsToReplace = {
        '&': ' ',
        '\\': ' ',
        '/': ' ',
        '(': ' ',
        ')': ' ',
        '`': ' ',
        '<': ' ',
        '>': ' '
    };
    return this.replace(/[&<>]/g, function(tag) {
        return tagsToReplace[tag] || tag;
    });
};

function update_element(element, value) {
    element = "#" + element;
    old_value = $(element).text()

    if ($("<div>" + value + "</div>").text() != old_value) {
        $(element).fadeOut('fast', function() {
            $(element).html(value);
            $(element).fadeIn('fast');
        });
    }
}

function round_to(precision, value) {
    value = parseFloat(value);
    power_of_ten = 10 ** precision;
    return Math.round(value * power_of_ten) / power_of_ten;
}

function scientific_prefix(prefix, value) {
    value = parseFloat(value);
    if (value / 1000000000 > 0.5)
        value = round_to(3, value / 1000000000) + " G";
    else if (value / 1000000 > 0.5)
        value = round_to(3, value / 1000000) + " M";
    else if (value / 1000 > 0.5)
        value = round_to(3, value / 1000) + " k";
    else
        value = round_to(3, value) + " ";
    return value + prefix;
}

function fetch_data(username) {
    $.getJSON('https://magi.duinocoin.com/users/' +
        encodeURIComponent(username),
        function(data) {
            data = data.result;
            address = data.balance.address;
            balance = data.balance.balance;
            balanceusd = round_to(4, balance * data.price.max);
            update_element("username", `${data.balance.username}`);
            update_element("balance", `${balance} Σ`);
            update_element("balanceusd", `≈ $${balanceusd}`);
            update_element("price_ducoe", `≈ $${round_to(4, data.price.ducoexchange)}`)
            update_element("price_btcpop", `≈ $${round_to(4, data.price.btcpop)}`)
            update_element("price_moondex", `≈ $${round_to(4, data.price.moondex)}`)

            transactions_html = "";
            data.transactions = data.transactions.reverse()

            for (transaction in data.transactions) {
                transaction = data.transactions[transaction];
                if (transaction.memo === "none") transaction.memo = "";
                else transaction.memo = `<i>"${transaction.memo}"</i>`;

                if (transaction.recipient == username || transaction.recipient == address) {
                    is_local = "";
                    if (transaction.sender) {
                        is_local = `
                                    <span>
                                        from
                                    </span>
                                    <b>
                                        <monospace>${transaction.sender}</monospace>
                                    </b>`
                    }
                    thtml = `
                            <div class="column is-full">
                                <p class="title is-size-6 has-text-weight-normal">
                                    <i class="fa fa-arrow-left fa-fw has-text-success"></i>
                                    <span>
                                        Received <b>${transaction.amount} XMG</b>
                                    </span>
                                    ${is_local}
                                    <span class="has-text-weight-normal">
                                        ${transaction.memo}
                                    </span>
                                </p>
                                <p class="subtitle is-size-7">
                                    <span>
                                        ${transaction.datetime}
                                    </span>
                                    <a href="https://magi.duinocoin.com/?search=${transaction.hash}" target="_blank">
                                        <monospace>${(transaction.hash.substr(transaction.hash.length - 16))}</monospace>
                                    </a>
                                </p>
                            </div>`;
                } else {
                    thtml = `
                            <div class="column is-full">
                                <p class="title is-size-6 has-text-weight-normal">
                                    <i class="fa fa-arrow-right fa-fw has-text-danger"></i>
                                    <span>
                                        Sent <b>${transaction.amount} XMG</b>
                                    </span>
                                    <span>
                                        to
                                    </span>
                                    <b>
                                        <monospace>${transaction.recipient}</monospace>
                                    </b>
                                    <span class="has-text-weight-normal">
                                        ${transaction.memo}
                                    </span>
                                </p>
                                <p class="subtitle is-size-7">
                                    <span>
                                        ${transaction.datetime}
                                    </span>
                                    <a href="https://magi.duinocoin.com/?search=${transaction.hash}" target="_blank">
                                        <monospace>${(transaction.hash.substr(transaction.hash.length - 16))}</monospace>
                                    </a>
                                </p>
                            </div>`;

                }
                transactions_html += thtml;
            }
            update_element("transactions", transactions_html);
        }).fail(function() {
        show_modal("Network error", "Error");
    });
}

function login(username, password) {
    $.getJSON('https://magi.duinocoin.com/auth/' +
        encodeURIComponent(username) +
        '?password=' +
        encodeURIComponent(password),
        function(data) {
            if (data.success == true) {
                if ($('#remember').is(":checked")) {
                    setcookie("password", password, 30);
                    setcookie("username", username, 30);
                }
                fetch_data(username);
                setInterval(function() {
                    fetch_data(username);
                }, 15 * 1000);
                $("#loginbutton").removeClass("is-loading");
                $("#loginsection").fadeOut(function() {
                    $("#balancediv").fadeIn(function() {
                        $("#pricesdiv").fadeIn(function() {
                            $("#transactionsdiv").fadeIn(function() {
                                $("#buttonsdiv").fadeIn();
                            });
                        });
                    });
                });
            } else {
                $("#loginbutton").removeClass("is-loading");
                show_modal(data.message, "Error");
            }
        }).fail(function() {
        $("#loginbutton").removeClass("is-loading");
        show_modal("Network error", "Error");
    });
}

function show_modal(content, title) {
    $('html').addClass('is-clipped');
    $('#modal').addClass('is-active');
    $("#modal .modal-card-title").html(title);
    $("#modal-content").html(content);
}

function show_register_modal() {
    $('html').addClass('is-clipped');
    $('#register_modal').addClass('is-active');
    $("#register_modal .modal-card-title").html("Create a new wallet");
}

function send_funds() {
    recipient = $("#recipient").val();
    amount = $("#amount").val();
    memo = $("#memo").val();
    console.log(recipient, amount, memo);
    if (recipient && amount) {
        $("#sendbutton").addClass("is-loading");
        $.getJSON('https://magi.duinocoin.com/transaction/' +
            '?username=' + encodeURIComponent(username) +
            '&password=' + encodeURIComponent(password) +
            '&recipient=' + encodeURIComponent(recipient) +
            '&amount=' + encodeURIComponent(amount) +
            '&memo=' + encodeURIComponent(memo),
            function(data) {
                if (data.success == true) {
                    $('html').removeClass('is-clipped');
                    $('#modal').removeClass('is-active');
                    $("#sendbutton").removeClass("is-loading");
                    show_modal("Successfully transferred funds" +
                        `<br>TXID: <a href="https://magi.duinocoin.com/?search=${data.result.split(",")[2]}">
                            <monospace>${data.result.split(",")[2]}</monospace></a>`, "Success");
                } else {
                    $('html').removeClass('is-clipped');
                    $('#modal').removeClass('is-active');
                    $("#sendbutton").removeClass("is-loading");
                    show_modal(data.message.split(",")[1], "Error");
                }
            }).fail(function() {
            $('html').removeClass('is-clipped');
            $('#modal').removeClass('is-active');
            $("#sendbutton").removeClass("is-loading");
            show_modal("Network error", "Error");
        });
    }
}

function setcookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        var expires = "; expires=" + date.toGMTString();
    } else
        var expires = "";
    document.cookie = name + "=" + value + expires + ";path=/";
}

function getcookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return undefined;
}

function delcookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

function logout() {
    delcookie("username");
    delcookie("password");
    window.location.reload(true);
}

function setErrorFor(input, message) {
    input.classList.add('is-danger');
    const field = input.parentElement;
    const small = field.querySelector('small');
    small.innerText = message;
}

function setSuccessFor(input) {
    input.classList.remove('is-danger');
    const field = input.parentElement;
    const small = field.querySelector('small');
    small.innerText = '';
}

function isEmail(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}

function checkInputs() {
    const usernameValue = username.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();
    const passwordConfirmValue = passwordConfirm.value.trim();

    let isFormValid = true;

    if (usernameValue === '') {
        setErrorFor(username, 'Username cannot be blank.');
        isFormValid = false;
    } else {
        setSuccessFor(username);
    }

    if (emailValue === '') {
        setErrorFor(email, 'Email cannot be blank.');
        isFormValid = false;
    } else if (!isEmail(emailValue)) {
        setErrorFor(email, 'Not a valid email.');
        isFormValid = false;
    } else {
        setSuccessFor(email);
    }

    if (passwordValue === '') {
        setErrorFor(password, 'Password cannot be blank.');
        isFormValid = false;
    } else {
        setSuccessFor(password);
    }

    if (passwordConfirmValue === '') {
        setErrorFor(passwordConfirm, 'Confirm password cannot be blank.');
        isFormValid = false;
    } else if (passwordValue !== passwordConfirmValue) {
        setErrorFor(passwordConfirm, 'The password and confirmation password do not match.');
        isFormValid = false;
    } else {
        setSuccessFor(passwordConfirm);
    }
    if (captcha !== undefined && captcha !== "") {
        captchainfo.innerHTML = "";
    } else {
        isFormValid = false;
        console.log(captcha);
        captchainfo.innerHTML = "Please answer the captcha correctly!";
    }

    return isFormValid;
}

function register() {
    captchainfo = document.getElementById('captchainfo');
    username = document.getElementById('username_regi');
    email = document.getElementById('email_regi');
    password = document.getElementById('password_regi');
    passwordConfirm = document.getElementById('password_regi_conf');
    captcha = grecaptcha.getResponse();
    if (checkInputs()) {
        $("#regibutton").addClass("is-loading");
        $.getJSON('https://magi.duinocoin.com/register/' +
            '?username=' + encodeURIComponent(username.value.trim()) +
            '&password=' + encodeURIComponent(password.value) +
            '&email=' + encodeURIComponent(email.value.trim()) +
            '&captcha=' + encodeURIComponent(captcha),
            function(data) {
                if (data.success == true) {
                    $('html').removeClass('is-clipped');
                    $('#register_modal').removeClass('is-active');
                    $("#regibutton").removeClass("is-loading");
                    show_modal(data.result, "Success");
                } else {
                    $('html').removeClass('is-clipped');
                    $('#register_modal').removeClass('is-active');
                    $("#regibutton").removeClass("is-loading");
                    show_modal(data.message, "Error");
                }
            });
    } else {
        return false;
    }
}

window.addEventListener('load', function() {
    (document.querySelectorAll('.notification .delete') || []).forEach(($delete) => {
        const $notification = $delete.parentNode;
        $delete.addEventListener('click', () => {
            $($notification).fadeOut('slow');
        });
    });

    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
    $navbarBurgers.forEach(el => {
        el.addEventListener('click', () => {
            const target = el.dataset.target;
            const $target = document.getElementById(target);
            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');
        });
    });

    $("#loginbutton").click(function() {
        if ($("#usernameinput").val() && $("#passwordinput").val()) {
            $("#loginbutton").addClass("is-loading")
            username = $("#usernameinput").val();
            password = $("#passwordinput").val();
            login(username, password);
        }
    });

    $("#receive").click(function() {
        finalstring = `
            <p class="heading">
                Your XMG <b>wallet address</b>
            </p>
            <p class="title is-size-5">
                <monospace>${address}</monospace>
            </p>
            <p class="heading">
                Your XMG <b>wallet username</b><br>(<span class="has-text-warning-dark">for other magi.duinocoin.com users</span>)
            </p>
            <p class="title is-size-5">
                <monospace>${username}</monospace>
            </p>
        `
        show_modal(finalstring, "Receive Magi");
    });

    $("#send").click(function() {
        finalstring = `
            <div class="columns is-multiline">
                <div class="column is-full">
                    <span class="heading">Recipient (address/username)</span>
                    <input class="input" id="recipient" placeholder="e.g. revox or 9RTb3ikRrWExsF6fis85g7vKqU1tQYVFuR" type="text">
                </div>
                <div class="column is-full">
                    <span class="heading">Amount (<span class="has-text-warning-dark">Note: a 0.05 XMG transaction fee will apply</span>)</span>
                    <input class="input" id="amount" placeholder="e.g. 3.1415" type="number" step="0.01" min="0.05">
                </div>
                <div class="column is-full">
                <span class="heading">Memo (optional)</span>
                    <input class="input" id="memo" placeholder="e.g. Kolka payment" type="text">
                </div>
                <div class="column is-full">
                    <button class="button is-fullwidth" id="sendbutton" onclick="send_funds()">
                        Confirm
                    </button>
                </div>
            </div>
        `
        show_modal(finalstring, "Send Magi");
    });

    document.querySelector('#modal .delete').onclick = function() {
        $('html').removeClass('is-clipped');
        $('#modal').removeClass('is-active');
    }

    document.querySelector('#register_modal .delete').onclick = function() {
        $('html').removeClass('is-clipped');
        $('#register_modal').removeClass('is-active');
    }

    if (getcookie("password") && getcookie("username")) {
        $('#usernameinput').val(getcookie("username"));
        $('#passwordinput').val(getcookie("password"));
        $('#loginbutton').click();
    }

    window.setTimeout(function() {
        $("#loader-wrapper").fadeOut('slow');
    }, 200);
});