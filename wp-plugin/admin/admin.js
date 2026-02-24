jQuery(document).ready(function ($) {
    console.log('[Flazz AI] Admin JS v1.0.3 Loaded');
    console.log('[Flazz AI] AJAX URL:', flazzData.ajax_url);

    // MANUAL TOOLS: Preset Selector fills URL field
    // ==========================================================================
    $(document).on('change', '#flazz_manual_preset', function () {
        var url = $(this).val();
        if (url) {
            $('#flazz_manual_rss_url').val(url);
        }
    });

    // Show/hide thumbnail style row based on image mode
    function toggleThumbnailStyleRow() {
        if ($('#flazz_research_image_mode').val() === 'generate_ai') {
            $('#row-thumbnail-style').show();
        } else {
            $('#row-thumbnail-style').hide();
        }
    }

    // Run on page load (in case browser remembered the select value)
    toggleThumbnailStyleRow();

    // Run on change
    $(document).on('change', '#flazz_research_image_mode', function () {
        toggleThumbnailStyleRow();
    });

    // MANUAL TOOLS: Fetch RSS Now
    // ==========================================================================
    $(document).on('click', '#flazz-manual-fetch', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var $status = $('#flazz-fetch-status');
        var rssUrl = $('#flazz_manual_rss_url').val().trim();

        $btn.prop('disabled', true).text('⏳ Memproses...');
        $status.html('<span style="color:#d64e07;">⏳ Sedang mengambil dan memproses berita...</span>');
        console.log('[Flazz AI] Manual Fetch started. URL:', rssUrl);

        $.post(flazzData.ajax_url, {
            action: 'flazz_manual_fetch',
            nonce: flazzData.nonce,
            rss_url: rssUrl
        }, function (response) {
            console.log('[Flazz AI] Fetch Response:', response);
            $btn.prop('disabled', false).text('▶ Fetch & Proses Sekarang');
            if (response.success) {
                $status.html('<span style="color:green;">✅ ' + response.data + '</span>');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] Fetch FAIL - Status:', xhr.status, 'Text:', xhr.responseText);
            $btn.prop('disabled', false).text('▶ Fetch & Proses Sekarang');
            $status.html('<span style="color:#d63638;">❌ HTTP Error ' + xhr.status + ' — ' + error + '</span>');
        });
    });

    // MANUAL TOOLS: Quick Research
    // ==========================================================================
    $(document).on('click', '#flazz-start-research', function () {
        var $btn = $(this);
        var $status = $('#flazz-research-status');
        var keyword = $('#flazz_research_keyword').val().trim();
        var style = $('#flazz_research_style').val() || 'Professional';
        var model = $('#flazz_research_model').val() || 'Straight News';
        var imgMode = $('#flazz_research_image_mode').val() || 'rss';
        var thumbStyle = $('#flazz_research_thumbnail_style').val() || 'editorial_vector';

        if (!keyword) {
            alert('Masukkan kata kunci terlebih dahulu.');
            return;
        }

        $btn.prop('disabled', true).text('⏳ Sedang riset...');

        var waitMsg = imgMode === 'generate_ai'
            ? '⏳ Mengambil berita + Generate gambar AI via Replicate... (bisa 60–90 detik)'
            : '⏳ Mengambil berita dari Google News dan memproses AI... (bisa 30–60 detik)';
        $status.html('<span style="color:#d64e07;">' + waitMsg + '</span>');
        console.log('[Flazz AI] Research:', keyword, '| Style:', style, '| Model:', model, '| Image:', imgMode, '| Thumb:', thumbStyle);


        $.post(flazzData.ajax_url, {
            action: 'flazz_research_keyword',
            nonce: flazzData.nonce,
            keyword: keyword,
            writing_style: style,
            article_model: model,
            image_mode: imgMode,
            thumbnail_style: thumbStyle
        }, function (response) {
            console.log('[Flazz AI] Research Response:', response);
            $btn.prop('disabled', false).text('🔬 Mulai Riset & Posting');
            if (response.success) {
                $status.html('<span style="color:green;">✅ ' + response.data + '</span>');
                $('#flazz_research_keyword').val('');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] Research FAIL - Status:', xhr.status, 'Text:', xhr.responseText.substring(0, 500));
            $btn.prop('disabled', false).text('🔬 Mulai Riset & Posting');
            $status.html('<span style="color:#d63638;">❌ HTTP Error ' + xhr.status + ' — Cek tab Network di DevTools untuk detail.</span>');
        });
    });

    // SETTINGS: Test API
    // ==========================================================================
    $(document).on('click', '#flazz-test-api', function () {
        var $btn = $(this);
        var $status = $('#test-api-status');

        $btn.prop('disabled', true).text('⏳ Testing...');
        $status.html('<span style="color:#666;">Menghubungi Groq...</span>');
        console.log('[Flazz AI] Testing API connection...');

        $.post(flazzData.ajax_url, {
            action: 'flazz_test_api',
            nonce: flazzData.nonce
        }, function (response) {
            console.log('[Flazz AI] API Test Response:', response);
            $btn.prop('disabled', false).text('🧪 Test Koneksi');
            if (response.success) {
                $status.html('<span style="color:green;">✅ ' + response.data + '</span>');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] API Test FAIL - Status:', xhr.status, 'Resp:', xhr.responseText.substring(0, 500));
            $btn.prop('disabled', false).text('🧪 Test Koneksi');
            $status.html('<span style="color:#d63638;">❌ HTTP ' + xhr.status + ' — ' + error + '</span>');
        });
    });

    // AUTO-JOBS: Open / Close form
    // ==========================================================================
    $(document).on('click', '#flazz-open-job-form', function () {
        $('#flazz-job-form-container').slideDown();
        $(this).hide();
    });

    $(document).on('click', '#flazz-close-job-form', function () {
        $('#flazz-job-form-container').slideUp();
        $('#flazz-open-job-form').show();
    });
    // Toggle keyword/rss/idea rows based on job type
    $(document).on('change', '#job_type', function () {
        var type = $(this).val();
        $('#row-keyword, #row-rss, #row-ai-idea').hide();

        if (type === 'rss_watcher') {
            $('#row-rss').show();
        } else if (type === 'ai_editor') {
            $('#row-ai-idea').show();
        } else {
            $('#row-keyword').show();
        }
    });

    // Toggle job thumbnail style row
    $(document).on('change', '#job_image_mode', function () {
        if ($(this).val() === 'generate_ai') {
            $('#row-job-thumbnail-style').show();
        } else {
            $('#row-job-thumbnail-style').hide();
        }
    });

    // AUTO-JOBS: Save
    $(document).on('click', '#flazz-save-job', function () {
        var $btn = $(this);
        var jobName = $('#job_name').val().trim();

        if (!jobName) {
            alert('Nama Job wajib diisi!');
            return;
        }

        $btn.prop('disabled', true).text('⏳ Menyimpan...');
        console.log('[Flazz AI] Saving job:', jobName);

        $.post(flazzData.ajax_url, {
            action: 'flazz_save_job',
            nonce: flazzData.nonce,
            job_name: jobName,
            job_type: $('#job_type').val(),
            keyword: $('#job_keyword').val(),
            rss_url: $('#job_rss_url').val(),
            ai_idea: $('#job_ai_idea').val(),
            category: $('#job_category').val(),
            article_model: $('#job_article_model').val(),
            image_mode: $('#job_image_mode').val(),
            thumbnail_style: $('#job_thumbnail_style').val(),
            max_articles: $('#job_max_articles').val(),
            writing_style: $('#job_writing_style').val(),
            publish_status: 'publish'
        }, function (response) {
            console.log('[Flazz AI] Save Job Response:', response);
            if (response.success) {
                alert('✅ ' + response.data);
                location.reload();
            } else {
                alert('❌ ' + response.data);
                $btn.prop('disabled', false).text('💾 Simpan Job');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] Save Job FAIL:', xhr.status, error);
            alert('❌ HTTP Error ' + xhr.status);
            $btn.prop('disabled', false).text('💾 Simpan Job');
        });
    });

    // AUTO-JOBS: Run
    $(document).on('click', '.run-job', function () {
        var $btn = $(this);
        var jobId = $btn.data('id');
        var orig = $btn.text();

        $btn.prop('disabled', true).text('⏳ Running...');
        console.log('[Flazz AI] Running job ID:', jobId);

        $.post(flazzData.ajax_url, {
            action: 'flazz_run_job',
            nonce: flazzData.nonce,
            job_id: jobId
        }, function (response) {
            console.log('[Flazz AI] Run Job Response:', response);
            $btn.prop('disabled', false).text(orig);
            if (response.success) {
                alert('✅ ' + response.data);
            } else {
                alert('❌ ' + response.data);
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] Run Job FAIL:', xhr.status, xhr.responseText.substring(0, 500));
            $btn.prop('disabled', false).text(orig);
            alert('❌ HTTP Error ' + xhr.status + '. Cek Server Error Log untuk detail.');
        });
    });

    // AUTO-JOBS: Delete
    $(document).on('click', '.delete-job', function () {
        if (!confirm('Yakin hapus job ini?')) return;

        var $btn = $(this);
        var jobId = $btn.data('id');

        $.post(flazzData.ajax_url, {
            action: 'flazz_delete_job',
            nonce: flazzData.nonce,
            job_id: jobId
        }, function (response) {
            if (response.success) {
                $btn.closest('tr').fadeOut(400, function () { $(this).remove(); });
            } else {
                alert('❌ ' + response.data);
            }
        }).fail(function (xhr) {
            alert('❌ HTTP Error ' + xhr.status);
        });
    });
});
