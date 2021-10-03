const api = "http://127.0.0.1:8000";

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

function fill_stats() {
    fetch(`${api}/statistics`)
        .catch(function(error) {
            console.log(error);
            $("#notification").fadeIn('slow');
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.result)
            if (data.success) {
                update_element("hashrate", scientific_prefix("H/s", data.result.hashrate));

                update_element("diff_pos", round_to(4, data.result.difficulty.pos));
                update_element("diff_pow", round_to(3, data.result.difficulty.pow));

                update_element("reward", `<b>${round_to(2, data.result.reward)} XMG</b>`);

                update_element("blocks", data.result.blocks);

                if (data.result.blocktx === 0) {
                    update_element("pendingtx", `NO PENDING TRANSACTIONS`);
                } else if (data.result.blocktx === 1) {
                    update_element("pendingtx", `<b>${data.result.blocktx}</b> PENDING TRANSACTION`);
                } else {
                    update_element("pendingtx", `<b>${data.result.blocktx}</b> PENDING TRANSACTIONS`);
                }
            }
        })
}


function btnsearch() {
    document.getElementById("searchbtn").classList.add("is-loading");
    to_search = $("#txid").val().escape();

    fetch(`${api}/transactions/${to_search}`)
        .catch(function(error) {
            console.log(error);
            update_element("txinfo", `Error getting transaction info: <b>${error}</b>
                                      <br>Try again later`);
        })
        .then(response => response.json())
        .then(data => {
            if (data.success === true) {
                if (data.result.fee === 0) fee = "unknown";
                else fee = data.result.fee + " XMG";

                last_num = data.result.amount.toString().slice(-1);

                res = `
                <div class="columns is-multiline">
                    <div class="column">
                        <p class="title is-size-6">
                            <span class="has-text-weight-normal">
                                Transaction
                            </span>
                            <b>${to_search}</b>
                        </p>
                        <div class="columns is-size-6 is-multiline is-gapless has-text-left">
                            <div class="column is-full mt-1">
                                <i class="mdi mdi-numeric-${last_num}-circle"></i>
                                <span>Amount: <b>${data.result.amount} ${data.result.currency}</b>
                                (<b>${fee}</b> fee)</span>
                            </div>
                            <div class="column is-full mt-1">
                                <i class="mdi mdi-account-arrow-right"></i>
                                <span>Sender: <b>${data.result.sender}</b></span>
                            </div>
                            <div class="column is-full mt-1">
                                <i class="mdi mdi-account-arrow-left"></i>
                                <span>Recipient: <b>${data.result.recipient}</b></span>
                            </div>
                            <div class="column is-full mt-1">
                                <i class="mdi mdi-message"></i>
                                <span>Memo: <b>${data.result.memo}</b></span>
                            </div>
                            <div class="column is-full mt-1">
                                <i class="mdi mdi-clock"></i>
                                <span>Timestamp: <b>${data.result.datetime}</b></span>
                            </div>
                            <div class="column is-full mt-1">
                                <i class="mdi mdi-dots-grid"></i>
                                <span>Block: <b>${data.result.block}</b></span>
                            </div>
                        </div>
                    </div>
                </div>
                `
                update_element("txinfo", res);
            } else {
                update_element("txinfo", "No transaction found :(");
            }
        })
        .finally(function() {
            document.getElementById("searchbtn").classList.remove("is-loading");
        });
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

    fill_stats();
    window.setInterval(function() {
        fill_stats()
    }, 7.5 * 1000);

    window.setTimeout(function() {
        $("#loader-wrapper").fadeOut('slow');
    }, 200);
});
